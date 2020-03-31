from typing import List, Optional, Tuple

from aiohttp import ClientSession
from multidict import CIMultiDictProxy

from .client import EntityCRUD
from .core import Action, EntityReference, Secret, Status, Version
from .python_sdk_exceptions import InvocationError


class ProceduralCtx(object):
    def __init__(
        self,
        provider,
        provider_prefix: str,
        provider_version: str,
        headers: CIMultiDictProxy,
    ):
        self.provider_url = provider.provider_url
        self.base_url = provider.entity_url
        self.provider_prefix = provider_prefix
        self.provider_version = provider_version
        self.provider_api = provider.provider_api
        self.provider = provider
        self.headers = headers

    def entity_client_for_user(self, entity_reference: EntityReference) -> EntityCRUD:
        return EntityCRUD(
            self.provider.papiea_url,
            self.provider_prefix,
            self.provider_version,
            entity_reference.kind,
            self.get_invoking_token(),
        )

    async def check_permission(
        self,
        entity_action: List[Tuple[Action, EntityReference]],
        provider_prefix: Optional[str] = None,
        provider_version: Optional[Version] = None,
    ) -> bool:
        if provider_prefix is None:
            provider_prefix = self.provider_prefix
        if provider_version is None:
            provider_version = self.provider_version
        return await self.try_check(provider_prefix, provider_version, entity_action)

    async def try_check(
        self,
        provider_prefix: str,
        provider_version: Version,
        entity_action: List[Tuple[Action, EntityReference]],
    ) -> bool:
        try:
            data_binary = json.dumps(entity_action).encode("utf-8")
            async with ClientSession() as session:
                async with session.post(
                    f"{ self.base_url }/{ provider_prefix }/{ provider_version }/check_permission",
                    data=data_binary,
                    headers=self.headers,
                ) as resp:
                    res = await resp.text()
            res = json.loads(res)
            return res["data"]["success"] == "Ok"
        except Exception as e:
            return False

    async def update_status(
        self, entity_reference: EntityReference, status: Status
    ) -> bool:
        try:
            await self.provider_api.patch(
                f"{self.provider_url}/update_status",
                {"entity_ref": entity_reference, "status": status},
            )
            return True
        except Exception as e:
            return False

    def update_progress(self, message: str, done_percent: int) -> bool:
        raise Exception("Unimplemented")

    def get_provider_security_api(self):
        return self.provider.provider_security_api

    def get_user_security_api(self, user_s2skey: Secret):
        return self.provider.new_security_api(user_s2skey)

    def get_headers(self) -> CIMultiDictProxy:
        return self.headers

    def get_invoking_token(self) -> str:
        if "authorization" in self.headers:
            parts = self.headers["authorization"].split(" ")
            if parts[0] == "Bearer":
                return parts[1]
        raise Exception("No invoking user")


class IntentfulCtx(ProceduralCtx):
    pass
