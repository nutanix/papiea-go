import time
import logging
from types import TracebackType
from typing import Any, Optional, List, Type, Callable, AsyncGenerator

from .api import ApiInstance
from .core import AttributeDict, Entity, EntityReference, EntitySpec, IntentWatcher, Metadata, Secret, Spec
FilterResults = AttributeDict

BATCH_SIZE = 20

class EntityCRUD(object):
    def __init__(
        self,
        papiea_url: str,
        prefix: str,
        version: str,
        kind: str,
        s2skey: Optional[str] = None,
        logger: logging.Logger = logging.getLogger(__name__),
    ):
        headers = {
            "Content-Type": "application/json",
        }
        if s2skey is not None:
            headers["Authorization"] = f"Bearer {s2skey}"
        self.api_instance = ApiInstance(
            f"{papiea_url}/services/{prefix}/{version}/{kind}", headers=headers, logger=logger
        )

    async def __aenter__(self) -> "EntityCRUD":
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        await self.api_instance.close()

    async def get(self, entity_reference: EntityReference) -> Entity:
        try:
            return await self.api_instance.get(entity_reference.uuid)
        except:
            raise

    async def get_all(self) -> List[Entity]:
        try:
            res = await self.api_instance.get("")
            return res.results
        except:
            raise

    async def create(
        self, spec: Spec, metadata_extension: Optional[Any] = None
    ) -> EntitySpec:
        try:
            payload = {"spec": spec}
            if metadata_extension is not None:
                payload["metadata"] = {"extension": metadata_extension}
            return await self.api_instance.post("", payload)
        except:
            raise

    async def create_with_meta(self, metadata: Metadata, spec: Spec) -> EntitySpec:
        try:
            payload = {"metadata": metadata, "spec": spec}
            return await self.api_instance.post("", payload)
        except:
            raise

    async def update(self, metadata: Metadata, spec: Spec) -> EntitySpec:
        try:
            payload = {"metadata": {"spec_version": metadata.spec_version}, "spec": spec}
            return await self.api_instance.put(metadata.uuid, payload)
        except:
            raise

    async def delete(self, entity_reference: EntityReference) -> None:
        try:
            return await self.api_instance.delete(entity_reference.uuid)
        except:
            raise

    async def filter(self, filter_obj: Any) -> FilterResults:
        try:
            res = await self.api_instance.post("filter", filter_obj)
            return res
        except:
            raise

    async def filter_iter(self, filter_obj: Any) -> Callable[[Optional[int], Optional[int]], AsyncGenerator[Any, None]]:
        async def iter_func(batch_size: Optional[int] = None, offset: Optional[int] = None):
            if not batch_size:
                batch_size = BATCH_SIZE
            res = await self.api_instance.post(f"filter?limit={batch_size}&offset={offset or ''}", filter_obj)
            if len(res.results) == 0:
                return
            else:
                for entity in res.results:
                    yield entity
                offset = offset or 0
                async for val in iter_func(batch_size, offset + batch_size):
                    yield val
                return
        return iter_func

    async def list_iter(self) -> Callable[[Optional[int], Optional[int]], AsyncGenerator[Any, None]]:
        return await self.filter_iter({})

    async def invoke_procedure(
        self, procedure_name: str, entity_reference: EntityReference, input_: Any
    ) -> Any:
        try:
            payload = {"input": input_}
            return await self.api_instance.post(
                f"{entity_reference.uuid}/procedure/{procedure_name}", payload
            )
        except:
            raise

    async def invoke_kind_procedure(self, procedure_name: str, input_: Any) -> Any:
        try:
            payload = {"input": input_}
            return await self.api_instance.post(f"procedure/{procedure_name}", payload)
        except:
            raise

class IntentWatcherClient(object):
    def __init__(
        self,
        papiea_url: str,
        s2skey: Secret = None,
        logger: logging.Logger = logging.getLogger(__name__)
    ):
        headers = {
            "Content-Type": "application/json",
        }

        if s2skey is not None:
            headers["Authorization"] = f"Bearer {s2skey}"
        self.api_instance = ApiInstance(
            f"{papiea_url}/services/intent_watcher", headers=headers, logger=logger
        )

        self.logger = logger

    async def __aenter__(self) -> "IntentWatcherApi":
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> None:
        await self.api_instance.close()

    async def get_intent_watcher(self, id: str) -> IntentWatcher:
        try:
            return await self.api_instance.get(id)
        except:
            raise

    async def list_intent_watcher(self) -> List[IntentWatcher]:
        try:
            res = await self.api_instance.get("")
            return res.results
        except:
            raise

    # filter_intent_watcher(AttributeDict(status=IntentfulStatus.Pending))
    async def filter_intent_watcher(self, filter_obj: Any) -> List[IntentWatcher]:
        try:
            res = await self.api_instance.post("filter", filter_obj)
            return res.results
        except:
            raise

    async def wait_for_watcher_status(self, watcher_ref: AttributeDict, watcher_status: AttributeDict, limit: int = 50) -> bool:
        try:
            start_time = time.time()
            while True:
                watcher = await self.get_intent_watcher(watcher_ref.uuid)
                if watcher.status == watcher_status.status:
                    return True
                end_time = time.time()
                time_elapsed = end_time - start_time
                if time_elapsed > limit:
                    raise Exception("Timeout waiting for intent watcher status")
                time.sleep(5)
        except:
            raise

class ProviderClient(object):
    def __init__(
        self,
        papiea_url: str,
        provider: str,
        version: str,
        s2skey: Optional[str] = None,
        logger: logging.Logger = logging.getLogger(__name__),
    ):
        self.papiea_url = papiea_url
        self.provider = provider
        self.version = version
        self.s2skey = s2skey
        self.logger = logger
        headers = {
            "Content-Type": "application/json",
        }
        if s2skey is not None:
            headers["Authorization"] = f"Bearer {s2skey}"
        self.api_instance = ApiInstance(
            f"{papiea_url}/services/{provider}/{version}", headers=headers, logger=logger
        )

    async def __aenter__(self) -> "ProviderClient":
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        await self.api_instance.close()

    def get_kind(self, kind: str) -> EntityCRUD:
        return EntityCRUD(
            self.papiea_url, self.provider, self.version, kind, self.s2skey, self.logger
        )

    async def invoke_procedure(self, procedure_name: str, input: Any) -> Any:
        try:
            payload = {"input": input}
            return await self.api_instance.post(f"procedure/{procedure_name}", payload)
        except:
            raise