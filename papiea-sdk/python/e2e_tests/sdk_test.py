import pytest
import time

import e2e_tests as papiea_test
import e2e_tests.provider_setup as provider
import e2e_tests.utils as test_utils

from papiea.core import AttributeDict, Spec

# Includes all the entity ops related tests
class TestEntityOperations:

    @pytest.mark.asyncio
    async def test_object_content_change_intent(self):
        papiea_test.logger.debug("Running test to change object content and validate intent resolver")

        try:
            server = await provider.setup_and_register_sdk()
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
                    await object_entity_client.update(b1_object1_entity.metadata, spec)

                    async def cb_function(entity_ref):
                        async with papiea_test.get_client(papiea_test.OBJECT_KIND) as object_entity_client:
                            b1_object1_entity = await object_entity_client.get(object_ref)

                            assert b1_object1_entity.status.content == obj_content
                            assert b1_object1_entity.status.size == len(obj_content)
                            assert len(b1_object1_entity.status.references) == 1
                            assert b1_object1_entity.status.references[0].bucket_name == bucket1_name
                            assert b1_object1_entity.status.references[0].object_name == object1_name
                            assert b1_object1_entity.status.references[0].bucket_reference.uuid == bucket1_entity.metadata.uuid

                    status = [
                        AttributeDict(content=AttributeDict(value=obj_content)),
                        AttributeDict(size=AttributeDict(value=len(obj_content))),
                        AttributeDict(references=AttributeDict(length=1))]
                    op_status = await test_utils.wait_for_status_change(papiea_test.OBJECT_KIND, object_ref, status, False, cb_function)
                    if op_status == True:
                        b1_object1_entity = await object_entity_client.get(object_ref)

                        assert b1_object1_entity.spec.content == obj_content        
                    else:
                        papiea_test.logger.debug("Intent resolver operation failed")
                        assert False
        finally:
            await server.close()