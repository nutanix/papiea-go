import asyncio
import functools
import time

import e2e_tests as papiea_test

from papiea.core import Any, AttributeDict, IntentfulStatus, IntentWatcher
from papiea.python_sdk import ProviderSdk

async def cleanup():
    async with papiea_test.get_client(papiea_test.OBJECT_KIND) as object_entity_client:
        try:
            object_list = await object_entity_client.get_all()
            for obj in object_list:
                await object_entity_client.delete(obj.metadata)
        except:
            raise

    async with papiea_test.get_client(papiea_test.BUCKET_KIND) as bucket_entity_client:
        try:
            bucket_list = await bucket_entity_client.get_all()
            for bucket in bucket_list:
                await bucket_entity_client.delete(bucket.metadata)
        except:
            raise

async def print_kinds_data():
    async with papiea_test.get_client(papiea_test.BUCKET_KIND) as bucket_entity_client:
        try:
            print(await bucket_entity_client.get_all())
        except:
            papiea_test.logger.debug("Failed to fetch the buckets")
            pass
    async with papiea_test.get_client(papiea_test.OBJECT_KIND) as object_entity_client:
        try:
            print(await object_entity_client.get_all())
        except:
            papiea_test.logger.debug("Failed to fetch the objects")
            pass

async def wait_for_diff_resolver(sdk: ProviderSdk, watcher: AttributeDict, retries: int = 10) -> bool:
    try:
        watcher_client = sdk.intent_watcher
        for _ in range(1, retries+1):
            watcher = await watcher_client.get_intent_watcher(watcher.uuid)
            if watcher.status == IntentfulStatus.Completed_Successfully:
                return True
            time.sleep(5)
    except:
        return False
    return False

async def wait_for_status_change_helper(kind: str, entity_ref: AttributeDict, status_val: list, retries: int) -> bool:
    try:
        async with papiea_test.get_client(kind) as entity_client:
            for _ in range(1, retries+1):
                res_entity = await entity_client.get(entity_ref)
                success = True
                for val in status_val:
                    if val[0] == 'length':
                        if len(res_entity.status.get(val[1])) != val[2]:
                            success = False
                            break
                    else: #value
                        if res_entity.status.get(val[1]) != val[2]:
                            success = False
                            break
                if success:
                    return True
                time.sleep(5)   
        return False
    except:
        raise

# [objects=AttributeDict(length=2), bucket_name=AttributeDict(value='new_name)]
async def wait_for_status_change(kind: str, entity_ref: AttributeDict, status: Any, sync: bool, callback: Any = None, retries: int = 10) -> bool:
    try:
        status_val = []
        for field_list in status:
            field = list(field_list.keys())[0]
            field_agg = list(field_list[field].keys())[0]
            field_val = field_list[field][field_agg]
            status_val.append([field_agg, field, field_val])
        if sync:
            return await wait_for_status_change_helper(kind, entity_ref, status_val, retries)
        else:
            task = asyncio.ensure_future(wait_for_status_change_helper(kind, entity_ref, status_val, retries))
            await task
            await callback(entity_ref)
            return True
    except:
        raise
    return False