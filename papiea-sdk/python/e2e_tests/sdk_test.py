import asyncio
import functools
import pytest
import time

import e2e_tests as papiea_test
import e2e_tests.provider_setup as provider
import e2e_tests.utils as test_utils

from papiea.core import AttributeDict, IntentfulStatus, Spec

# Includes all the entity ops related tests
class TestEntityOperations:

    async def add_done_callback(self, task, callback, entity_ref):
        result = await task
        await callback(entity_ref=entity_ref)
        return result

    @pytest.mark.asyncio
    async def test_object_content_change_intent(self):
        papiea_test.logger.debug("Running test to change object content and validate intent resolver")

        try:
            sdk = await provider.setup_and_register_sdk()
        except Exception as ex:
            papiea_test.logger.debug("Failed to setup/register sdk : " + str(ex))
            return

        try:
            await test_utils.cleanup()
        except Exception as ex:
            papiea_test.logger.debug("Failed cleanup : " + str(ex))
            raise Exception("Cleanup operation failed : " + str(ex))

        try:
            async with papiea_test.get_client(papiea_test.BUCKET_KIND) as bucket_entity_client:
                bucket1_name = "test-bucket1"

                bucket_ref = await bucket_entity_client.invoke_kind_procedure("ensure_bucket_exists", bucket1_name)
                bucket1_entity = await bucket_entity_client.get(bucket_ref)

                assert bucket1_entity.spec.name == bucket1_name
                assert len(bucket1_entity.spec.objects) == 0

                object1_name = "test-object1"

                object_ref = await bucket_entity_client.invoke_procedure("create_object", bucket1_entity.metadata, object1_name)
                async with papiea_test.get_client(papiea_test.OBJECT_KIND) as object_entity_client:
                    b1_object1_entity = await object_entity_client.get(object_ref)

                    bucket1_entity = await bucket_entity_client.get(bucket_ref)

                    assert b1_object1_entity.spec.content == ""

                    obj_content = "test-content"
                    spec = Spec(
                        content=obj_content
                    )
                    watcher_ref = await object_entity_client.update(b1_object1_entity.metadata, spec)

                    async def cb_function(entity_ref):
                        async with papiea_test.get_client(papiea_test.OBJECT_KIND) as object_entity_client:
                            b1_object1_entity = await object_entity_client.get(object_ref)

                            assert b1_object1_entity.status.content == obj_content
                            assert b1_object1_entity.status.size == len(obj_content)
                            assert len(b1_object1_entity.status.references) == 1
                            assert b1_object1_entity.status.references[0].bucket_name == bucket1_name
                            assert b1_object1_entity.status.references[0].object_name == object1_name
                            assert b1_object1_entity.status.references[0].bucket_reference.uuid == bucket1_entity.metadata.uuid

                    watcher_status = AttributeDict(status=IntentfulStatus.Completed_Successfully)

                    task = asyncio.create_task(sdk.intent_watcher.wait_for_watcher_status(watcher_ref.watcher, watcher_status, 50))
                    await self.add_done_callback(task, cb_function, b1_object1_entity)

                    b1_object1_entity = await object_entity_client.get(object_ref)
                    assert b1_object1_entity.spec.content == obj_content
        finally:
            await sdk.server.close()