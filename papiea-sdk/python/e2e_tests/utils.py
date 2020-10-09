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