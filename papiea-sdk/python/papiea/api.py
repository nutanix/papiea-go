import json
import logging
from types import TracebackType
from typing import Any, Optional, Type

from aiohttp import ClientSession, ClientTimeout
from multidict import CIMultiDict

from papiea.python_sdk_exceptions import (
    ApiException,
    ConflictingEntityException,
    EntityNotFoundException,
    PermissionDeniedException,
    ProcedureInvocationException,
    UnauthorizedException,
    ValidationException,
    BadRequestException,
    PapieaServerException,
    check_response
)
from papiea.utils import json_loads_attrs

class ApiInstance:
    def __init__(
            self,
            base_url: str,
            timeout: int = 5000,
            headers: dict = {},
            *,
            logger: logging.Logger
    ):
        self.base_url = base_url
        self.headers = headers
        self.timeout = timeout
        self.session = ClientSession(timeout=ClientTimeout(total=timeout))
        self.logger = logger

    async def __aenter__(self) -> "ApiInstance":
        return self

    async def __aexit__(
            self,
            exc_type: Optional[Type[BaseException]],
            exc_val: Optional[BaseException],
            exc_tb: Optional[TracebackType],
    ) -> None:
        await self.close()

    @staticmethod
    def check_result(res: Any) -> Any:
        if res == "":
            return None
        return json_loads_attrs(res)

    async def call(self, method: str, prefix: str, data: Any, headers: dict = {}):
        new_headers = CIMultiDict()
        new_headers.update(self.headers)
        new_headers.update(headers)
        data_binary = json.dumps(data).encode("utf-8")
        # TODO: this is too much code duplication but I cannot think of
        # a way outside macros that could abstract async with block
        # and sadly there are no macro in python
        if method == "get":
            async with self.session.get(
                    self.base_url + "/" + prefix, headers=new_headers, ssl=False
            ) as resp:
                await check_response(resp, self.logger)
                res = await resp.text()
            return self.check_result(res)
        elif method == "post":
            async with self.session.post(
                    self.base_url + "/" + prefix, data=data_binary, headers=new_headers, ssl=False
            ) as resp:
                await check_response(resp, self.logger)
                res = await resp.text()
            return self.check_result(res)
        elif method == "put":
            async with self.session.put(
                    self.base_url + "/" + prefix, data=data_binary, headers=new_headers, ssl=False
            ) as resp:
                await check_response(resp, self.logger)
                res = await resp.text()
            return self.check_result(res)
        elif method == "patch":
            async with self.session.patch(
                    self.base_url + "/" + prefix, data=data_binary, headers=new_headers, ssl=False
            ) as resp:
                await check_response(resp, self.logger)
                res = await resp.text()
            return self.check_result(res)
        elif method == "delete":
            async with self.session.delete(
                    self.base_url + "/" + prefix, headers=new_headers, ssl=False
            ) as resp:
                await check_response(resp, self.logger)
                res = await resp.text()
            return self.check_result(res)

    async def make_request(self, method: str, prefix: str, data: Any, headers: dict):
        try:
            return await self.call(method, prefix, data, headers)
        except (ConflictingEntityException, EntityNotFoundException,
                PermissionDeniedException, ProcedureInvocationException,
                UnauthorizedException, ValidationException, BadRequestException,
                PapieaServerException, ApiException):
            raise
        except:
            self.logger.debug("RENEWING SESSION")
            await self.renew_session()
            return await self.call(method, prefix, data, headers)

    async def post(self, prefix: str, data: Any, headers: dict = {}) -> Any:
        return await self.make_request("post", prefix, data, headers)

    async def put(self, prefix: str, data: Any, headers: dict = {}) -> Any:
        return await self.make_request("put", prefix, data, headers)

    async def patch(self, prefix: str, data: Any, headers: dict = {}) -> Any:
        return await self.make_request("patch", prefix, data, headers)

    async def get(self, prefix: str, headers: dict = {}) -> Any:
        return await self.make_request("get", prefix, {}, headers)

    async def delete(self, prefix: str, headers: dict = {}) -> Any:
        return await self.make_request("delete", prefix, {}, headers)

    async def close(self):
        await self.session.close()

    async def renew_session(self):
        await self.close()
        self.session = ClientSession(timeout=ClientTimeout(total=self.timeout))
