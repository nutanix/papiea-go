import time

import e2e_tests as papiea_test

from papiea.core import AttributeDict, IntentfulStatus, IntentWatcher
from papiea.python_sdk import IntentWatcherApi

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

async def wait_for_diff_resolver(watcher: AttributeDict, retries: int = 10) -> bool:
    try:
        watcher_api = IntentWatcherApi(papiea_url=papiea_test.PAPIEA_URL, s2skey=papiea_test.PAPIEA_ADMIN_S2S_KEY, logger=papiea_test.logger)
        for _ in range(1, retries+1):
            watcher = await watcher_api.get_intent_watcher(watcher.uuid)
            if watcher.status == IntentfulStatus.Completed_Successfully:
                return True
            time.sleep(5)
    except:
        return False
    return False