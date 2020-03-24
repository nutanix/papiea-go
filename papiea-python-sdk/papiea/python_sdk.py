import json
from typing import Optional, Any, NoReturn, Callable

from aiohttp import web, ClientSession

from core import Secret, Version, Kind, DataDescription, ProceduralExecutionStrategy, UserInfo, S2S_Key
from python_sdk_context import ProceduralCtx
from python_sdk_exceptions import InvocationError, SecurityApiError

ProviderPower = str

class ProviderServerManager(object):
    pass

    # TODO


class SecurityApi(object):
    def __init__(self, provider: ProviderSdk, s2s_key: Secret):
        self.provider = provider
        self.s2s_key = s2s_key

    async def user_info(self) -> UserInfo:
        "Returns the user-info of user with s2skey or the current user"
        try:
            url = f"{self.provider.get_prefix()}/{self.provider.get_version()}"
            res = await self.provider.provider_api.get(f"{url}/auth/user_info", headers={"Authorization": f"Bearer {self.s2s_key}"})
            return res["data"]
        except Exception as e:
            raise SecurityApiError.from_error(e, "Cannot get user info")

    async def list_keys(self) -> List[S2S_Key]:
        try:
            url = f"{self.provider.get_prefix()}/{self.provider.get_version()}"
            res = await self.provider.provider_api.get(f"{url}/s2skey", headers={"Authorization": f"Bearer {self.s2s_key}"})
            return res["data"]
        except Exception as e:
            raise SecurityApiError.from_error(e, "Cannot list s2s keys")


    async def create_key(self, new_key: S2S_Key) -> S2S_Key:
        try:
            url = f"{self.provider.get_prefix()}/{self.provider.get_version()}"
            res = await self.provider.provider_api.post(f"{url}/s2skey", data=new_key, headers={"Authorization": f"Bearer {self.s2s_key}"})
            return res["data"]
        except Exception as e:
            raise SecurityApiError.from_error(e, "Cannot create s2s key")

    async def deactivate_key(self, key_to_deactivate: str) -> Any:
        try:
            url = f"{self.provider.get_prefix()}/{self.provider.get_version()}"
            res = await self.provider.provider_api.post(f"{url}/s2skey", data={"key": key_to_deactivate, "active":False}, headers={"Authorization": f"Bearer {self.s2s_key}"})
            return res["data"]
        except Exception as e:
            raise SecurityApiError.from_error(e, "Cannot deactivate s2s key")


class KindBuilder(object):
    def __init__(self, kind: Kind, provider: ProviderSdk, allow_extra_props: boolean):
        self.kind = kind
        self.provider = provider
        self.allow_extra_props = allow_extra_props
    
    # TODO


class ApiInstance(object):
    def __init__(self, base_url: str, timeout: int, headers: dict):
        self.base_url = base_url
        self.timeout = timeout
        self.headers = headers
        self.session = ClientSession(timeout=self.timeout)

    async def post(self, prefix: str, data: dict, headers: dict = {}) -> str:
        new_headers = {}
        new_headers.update(self.headers)
        new_headers.update(headers)
        data_binary = json.dumps(data).encode("utf-8")
        async with session.post(self.base_url + "/" + prefix,
                                data=data_binary,
                                headers=new_headers) as resp:
            res = await resp.text()
        return res

    async def get(self, prefix: str, headers: dict = {}) -> str:
        new_headers = {}
        new_headers.update(self.headers)
        new_headers.update(headers)
        async with session.get(self.base_url + "/" + prefix,
                                headers=new_headers) as resp:
            res = await resp.text()
        return res

    async def close(self):
        await self.session.close()


class ProviderSdk(object):
    def __init__(self, papiea_url: str, s2skey: Secret, server_manager: Optional[ProviderServerManager] = None, allow_extra_props: bool = False):
        self._version = None
        self._prefix = None
        self._kind = []
        self._provider = None
        self.papiea_url = papiea_url
        self._s2skey = s2skey
        if server_manager is not None:
            self._server_manager = server_manager
        else:
            self._server_manager = ProviderServerManager()
        self._procedures = {}
        self.meta_ext = {}
        self.allow_extra_props = allow_extra_props
        self._security_api = SecurityApi(self, s2skey)
        self._provider_api = ApiInstance(self.provider_url, 5000, {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._s2skey}"
        })

    @property
    def provider(self) -> Provider:
        if self._provider is not None:
            return self._provider
        else:
            raise Exception("Provider not created")

    @property
    def provider_url(self) -> str:
        return f"{ self.papiea_url }/provider"

    @property
    def provider_api(self):
        return self._provider_api

    @property
    def entity_url(self) -> str:
        return f"{ self.papiea_url }/services"

    def get_prefix(self) -> str:
        if self._prefix is not None:
            return self._prefix
        else:
            raise Exception("Provider prefix is not set")

    def get_version(self) -> Version:
        if self._version is not None:
            return self._version
        else:
            raise Exception("Provider version is not set")

    @property
    def server(self):
        return self._server_manager.server

    def new_kind(self, entity_description: DataDescription) -> KindBuilder:
        if len(entity_description) == 0:
            raise Exception("Wrong kind description specified")
        for name in entity_description:
            if "x-papiea-entity" not in entity_description[name]:
                raise Exception(f"Entity not a papiea entity. Please make sure you have 'x-papiea-entity' property for '{name}'")
            the_kind = {
                "name": name,
                "name_plural": name + "s",
                "kind_structure": entity_description,
                "intentful_signatures": [],
                "dependency_tree": {},
                "kind_procedures": {},
                "entity_procedures": {},
                "intentful_behaviour": entity_description[name]["x-papiea-entity"],
                "differ": None
            }
            kind_builder = KindBuilder(the_kind, self, self.allow_extra_props)
            self._kind.push(the_kind)
            return kind_builder


    def add_kind(self, kind: Kind) -> KindBuilder:
        if kind not in self._kind.indexOf(kind):
            self._kind.append(kind)
            kind_builder = KindBuilder(kind, self, self.allow_extra_props)
            return kind_builder
        else:
            return None

    def remove_kind(self, kind: Kind) -> bool:
        try:
            self._kind.remove(kind)
            return True
        except ValueError:
            return False

    def version(self, version: Version) -> ProviderSdk:
        self._version = version
        return self

    def prefix(self, prefix: string) -> ProviderSdk:
        self._prefix = prefix
        return self

    def metadata_extension(self, ext: DataDescription) -> ProviderSdk:
        self.meta_ext = ext
        return self

    def provider_procedure(self, name: str, rbac: Any,
                       strategy: ProceduralExecutionStrategy,
                       input_desc: Any,
                       output_desc: Any,
                       handler: Callable[[ProceduralCtx, Any], Any]) -> ProviderSdk:
        procedure_callback_url = self._server_manager.procedure_callback_url(name)
        callback_url = self._server_manager.callback_url()
        procedural_signature = {
            "name": name,
            "argument": input_desc,
            "result": output_desc,
            "execution_strategy": strategy,
            "procedure_callback": procedure_callback_url,
            "base_callback": callback_url
        }
        self._procedures[name] = procedural_signature
        prefix = self.get_prefix()
        version = self.get_version()

        async def procedure_callback_fn(req):
            try:
                body_json = await req.json()
                result = await handler(ProceduralCtx(self, prefix, version, req.headers), body_json)
                return web.json_response(result)
            except InvocationError as e:
                return web.json_response(e.to_response(), status=e.status_code)
            except Exception as e:
                e = InvocationError.from_error(e)
                return web.json_response(e.to_response(), status=e.status_code)

        self._server_manager.register_handler("/" + name, procedure_callback_fn);
        return self

    async def register(self):
        if self._prefix is not None and self._version is not None and len(self._kind) > 0:
            self._provider = {
                "kinds": self._kind,
                "version": self._version,
                "prefix": self._prefix,
                "procedures": self._procedures,
                "extension_structure": self.meta_ext,
                "allowExtraProps": self.allow_extra_props
            }
            if self._policy is not None:
                self._provider["policy"] = self._policy
            if self._oauth2 is not None:
                self._provider["oauth2"] = self._oauth2
            if self._authModel is not None:
                self._provider["authModel"] = self._authModel
            await self._provider_api.post("/", self._provider)
            self._server_manager.start_server()
        elif self._prefix is None:
            ProviderSdk._provider_description_error("prefix")
        elif self._version is None:
            ProviderSdk._provider_description_error("version")
        elif len(self._kind) == 0:
            ProviderSdk._provider_description_error("kind")

    def power(self, state: ProviderPower) -> ProviderPower:
        raise Exception("Unimplemented")

    @staticmethod
    def _provider_description_error(missing_field: str) -> NoReturn:
        raise Exception(f"Malformed provider description. Missing: { missing_field }")

    @staticmethod
    def create_provider(papiea_url: str, s2skey: Secret, public_host: Optional[str], public_port: Optional[int], allow_extra_props: bool = false) -> ProviderSdk:
        server_manager = ProviderServerManager(public_host, public_port)
        return ProviderSdk(papiea_url, s2skey, server_manager, allow_extra_props)

    def secure_with(self, oauth_config: Any, casbin_model: str, casbin_initial_policy: str) -> ProviderSdk:
        self._oauth2 = oauth_config
        self._authModel = casbin_model
        self._policy = casbin_initial_policy
        return self

    @property
    def server_manager(self) -> ProviderServerManager:
        return self._server_manager

    @property
    def provider_security_api(self) -> SecurityApi:
        return self._security_api

    def new_security_api(self, s2s_key: str) -> SecurityApi:
        return SecurityApi(self, s2s_key)

    @property
    def s2s_key(self) -> Secret:
        return self._s2skey