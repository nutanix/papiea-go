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

                    callback_invoked = False
                    def cb_function(fut: asyncio.Future):
                        nonlocal callback_invoked
                        callback_invoked = True

                    watcher_ref = await object_entity_client.update(b1_object1_entity.metadata, spec)

                    watcher_status = IntentfulStatus.Completed_Successfully
                    task = asyncio.create_task(sdk.intent_watcher.wait_for_watcher_status(watcher_ref.watcher, watcher_status, 50))
                    task.add_done_callback(cb_function)

                    await asyncio.sleep(10)

                    b1_object1_entity = await object_entity_client.get(object_ref)

                    assert b1_object1_entity.spec.content == obj_content
                    assert callback_invoked == True
        finally:
            await sdk.server.close()