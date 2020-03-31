import json
from types import TracebackType
from typing import Any, Optional, Type

from aiohttp import ClientSession, ClientTimeout, web

from core import AttributeDict


def json_loads_attrs(s: str) -> Any:
    def object_hook(obj):
        return AttributeDict(obj)

    return json.loads(s, object_hook=object_hook)


class ApiException(Exception):
    def __init__(self, status: int, reason: str, details: str):
        super().__init__(reason)
        self.status = status
        self.reason = reason
        self.details = details

    @staticmethod
    async def check_response(resp: web.Response) -> None:
        if resp.status >= 400:
            details = await resp.text()
            try:
                details = json_loads_attrs(details)
            except:
                pass
            raise ApiException(resp.status, resp.reason, details)


class ApiInstance(object):
    def __init__(self, base_url: str, timeout: int = 5000, headers: dict = {}):
        self.base_url = base_url
        self.headers = headers
        self.session = ClientSession(timeout=ClientTimeout(total=timeout))

    async def __aenter__(self) -> "ApiInstance":
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        await self.close()

    async def post(self, prefix: str, data: dict, headers: dict = {}) -> Any:
        new_headers = {}
        new_headers.update(self.headers)
        new_headers.update(headers)
        data_binary = json.dumps(data).encode("utf-8")
        async with self.session.post(
            self.base_url + "/" + prefix, data=data_binary, headers=new_headers
        ) as resp:
            await ApiException.check_response(resp)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def put(self, prefix: str, data: dict, headers: dict = {}) -> Any:
        new_headers = {}
        new_headers.update(self.headers)
        new_headers.update(headers)
        data_binary = json.dumps(data).encode("utf-8")
        async with self.session.put(
            self.base_url + "/" + prefix, data=data_binary, headers=new_headers
        ) as resp:
            await ApiException.check_response(resp)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def patch(self, prefix: str, data: dict, headers: dict = {}) -> Any:
        new_headers = {}
        new_headers.update(self.headers)
        new_headers.update(headers)
        data_binary = json.dumps(data).encode("utf-8")
        async with self.session.patch(
            self.base_url + "/" + prefix, data=data_binary, headers=new_headers
        ) as resp:
            await ApiException.check_response(resp)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def get(self, prefix: str, headers: dict = {}) -> Any:
        new_headers = {}
        new_headers.update(self.headers)
        new_headers.update(headers)
        async with self.session.get(
            self.base_url + "/" + prefix, headers=new_headers
        ) as resp:
            await ApiException.check_response(resp)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def delete(self, prefix: str, headers: dict = {}) -> Any:
        new_headers = {}
        new_headers.update(self.headers)
        new_headers.update(headers)
        async with self.session.delete(
            self.base_url + "/" + prefix, headers=new_headers
        ) as resp:
            await ApiException.check_response(resp)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def close(self):
        await self.session.close()
