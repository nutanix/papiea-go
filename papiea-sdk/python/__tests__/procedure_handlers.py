from datetime import datetime, timezone

import __tests__ as papiea_test
import __tests__.utils as utils

from papiea.core import AttributeDict, EntityReference, Spec
from papiea.python_sdk_exceptions import ConflictingEntityException

async def ensure_bucket_exists_handler(ctx, input_bucket_name):
    # Run get query to obtain the list of buckets
    # Check if bucket_name exists in the bucket list
    # If true, simply return the bucket
    # Else, create a new bucket with input_bucket_name and return

    try:
        async with ctx.entity_client_for_user(utils.bucket_kind_dict) as bucket_entity_client:
            desired_bucket = await bucket_entity_client.filter(AttributeDict(spec=AttributeDict(name=input_bucket_name)))
            if len(desired_bucket.results) != 0:
                papiea_test.logger.debug("Bucket already exists. Returning it...")

                return EntityReference(
                    uuid=desired_bucket.results[0].metadata.uuid,
                    kind=desired_bucket.results[0].metadata.kind
                )

            papiea_test.logger.debug("Bucket not found. Creating new bucket...")

            bucket_ref = await bucket_entity_client.create(
                spec=Spec(name=input_bucket_name, objects=list()),
                metadata_extension={
                    "owner": "nutanix"
                }
            )

            ret_entity = await bucket_entity_client.get(bucket_ref.metadata)

            return EntityReference(
                uuid=ret_entity.metadata.uuid,
                kind=ret_entity.metadata.kind
            )
    except Exception as ex:
        raise Exception(str(ex))

    return EntityReference(uuid="", kind="", message="Unable to create bucket entity")

async def change_bucket_name_handler(ctx, entity_bucket, new_bucket_name):
    # check if there's any bucket with the new name
    # if found, return None/failure
    # else update name and bucket entity

    try:
        async with ctx.entity_client_for_user(utils.bucket_kind_dict) as bucket_entity_client:
            matched_bucket = await bucket_entity_client.filter(AttributeDict(spec=AttributeDict(name=new_bucket_name)))
            if len(matched_bucket.results) == 0:
                papiea_test.logger.debug("Bucket found. Changing the bucket name...")

                entity_bucket.spec.name = new_bucket_name
                await bucket_entity_client.update(
                    metadata=entity_bucket.metadata,
                    spec=entity_bucket.spec
                )

                ret_entity = await bucket_entity_client.get(entity_bucket.metadata)
                return EntityReference(
                    uuid=ret_entity.metadata.uuid,
                    kind=ret_entity.metadata.kind
                )
            else:
                raise Exception("Bucket with new name already exists")
    except Exception as ex:
        raise Exception(str(ex))

    return EntityReference(uuid="", kind="", message="Unable to change name for the bucket entity")

async def create_object_handler(ctx, entity_bucket, input_object_name):
    # check if object name already exists in entity.objects
    # if found, return None/failure
    # else create a new object entity and add the object name
    # reference in the objects list and return the bucket reference

    try:
        objects_list = entity_bucket.spec.objects
        if not any(obj.name == input_object_name for obj in objects_list):
            papiea_test.logger.debug("Object does not exist. Creating new object...")

            async with ctx.entity_client_for_user(utils.object_kind_dict) as object_entity_client:
                entity_object = await object_entity_client.create(
                    Spec(content=""),
                    metadata_extension={
                        "owner": "nutanix"
                    }
                )

                async with ctx.entity_client_for_user(utils.bucket_kind_dict) as bucket_entity_client:
                    entity_bucket.spec.objects.append(
                        AttributeDict(name=input_object_name,
                            reference=EntityReference(
                                uuid=entity_object.metadata.uuid,
                                kind=papiea_test.OBJECT_KIND
                            )
                        )
                    )
                    await bucket_entity_client.update(
                        metadata=entity_bucket.metadata,
                        spec=entity_bucket.spec
                    )

                ret_entity = await object_entity_client.get(entity_object.metadata)
                return EntityReference(
                    uuid=ret_entity.metadata.uuid,
                    kind=ret_entity.metadata.kind
                )
        else:
            raise Exception("Object already exists in the bucket")
    except Exception as ex:
        raise Exception(str(ex))

    return EntityReference(uuid="", kind="", message="Unable to create object entity")

async def link_object_handler(ctx, entity_bucket, input_object):
    # assuming input_object to be the object name and the uid
    # check if the name already exist in the objects list
    # if exists, return None/failure
    # else add object name and uid in bucket' objects list
    # and return the bucket reference

    try:
        objects_list = entity_bucket.spec.objects
        if not any(obj.name == input_object.object_name for obj in objects_list):
            papiea_test.logger.debug("Object does not exist. Linking the object...")

            async with ctx.entity_client_for_user(utils.bucket_kind_dict) as bucket_entity_client:
                entity_bucket.spec.objects.append(
                    AttributeDict(name=input_object.object_name,
                        reference=EntityReference(
                            uuid=input_object.object_uuid,
                            kind=papiea_test.OBJECT_KIND
                        )
                    )
                )
                await bucket_entity_client.update(
                    metadata=entity_bucket.metadata,
                    spec=entity_bucket.spec
                )

            async with ctx.entity_client_for_user(utils.object_kind_dict) as object_entity_client:
                ret_entity = await object_entity_client.get(AttributeDict(uuid=input_object.object_uuid))
                return EntityReference(
                    uuid=ret_entity.metadata.uuid,
                    kind=ret_entity.metadata.kind
                )
        else:
            raise Exception("Object already exists in the bucket")
    except Exception as ex:
        raise Exception(str(ex))

    return EntityReference(uuid="", kind="", message="Unable to link object entity")

async def unlink_object_handler(ctx, entity_bucket, input_object):
    # assuming input_object to be the object name and the uid
    # check if the name exists in the object list
    # if does not exists, return None/failure
    # else remove the object name and reference from the bucket' objects list and
    # and return the bucket reference

    try:
        objects_list = entity_bucket.spec.objects
        if any(obj.name == input_object.object_name for obj in objects_list):
            papiea_test.logger.debug("Object found. Unlinking the object...")

            async with ctx.entity_client_for_user(utils.bucket_kind_dict) as bucket_entity_client:
                entity_bucket.spec.objects[:] = [d for d in entity_bucket.spec.objects if d.get("name") != input_object.object_name]
                await bucket_entity_client.update(
                    metadata=entity_bucket.metadata,
                    spec=entity_bucket.spec
                )

                ret_entity = await bucket_entity_client.get(entity_bucket.metadata)
                return EntityReference(
                    uuid=ret_entity.metadata.uuid,
                    kind=ret_entity.metadata.kind
                )
        else:
            raise Exception("Object not found in the bucket")
    except Exception as ex:
        raise Exception(str(ex))

    return EntityReference(uuid="", kind="", message="Unable to unlink object entity")

async def bucket_create_handler(ctx, entity_bucket):
    try:
        papiea_test.logger.debug("Executing bucket create intent handler...")

        status = AttributeDict(
            name=entity_bucket.spec.name,
            objects=list()
        )
        await ctx.update_status(entity_bucket.metadata, status)
    except Exception as ex:
        raise Exception("Unable to execute bucket create intent handler: " + str(ex))

async def bucket_name_handler(ctx, entity_bucket, diff):
    # fetch unique uuids for the objects in the bucket
    # for each uuid, get the object references list
    # iterate and update bucket name if bucket ref match is found
    # update all such object entities

    try:
        papiea_test.logger.debug("Executing bucket name change intent handler...")

        object_uuid_set = set()
        for obj in entity_bucket.spec.objects:
            object_uuid_set.add(obj.reference.uuid)

        async with papiea_test.get_client(papiea_test.OBJECT_KIND) as object_entity_client:
            for object_uuid in object_uuid_set:
                entity_object = await object_entity_client.get(AttributeDict(uuid=object_uuid))

                for i in range(len(entity_object.status.references)):
                    if entity_object.status.references[i].bucket_reference.uuid == entity_bucket.metadata.uuid:
                        entity_object.status.references[i].bucket_name = entity_bucket.spec.name

                await ctx.update_status(entity_object.metadata, entity_object.status)

        entity_bucket.status.name = entity_bucket.spec.name
        await ctx.update_status(entity_bucket.metadata, entity_bucket.status)
    except Exception as ex:
        raise Exception("Unable to execute bucket name change intent handler: " + str(ex))

async def on_object_added(ctx, entity_bucket, diff):
    try:
        papiea_test.logger.debug("Executing object added to bucket intent handler...")

        async with papiea_test.get_client(papiea_test.OBJECT_KIND) as object_entity_client:
            entity_object = await object_entity_client.get(AttributeDict(uuid=diff[0].spec[0].reference.uuid))

            entity_object.status.references.append(
                AttributeDict(
                    bucket_name=entity_bucket.spec.name,
                    object_name=diff[0].spec[0].name,
                    bucket_reference=AttributeDict(
                        uuid=entity_bucket.metadata.uuid,
                        kind=papiea_test.BUCKET_KIND
                    )
                )
            )
            await ctx.update_status(entity_object.metadata, entity_object.status)

        entity_bucket.status.objects = entity_bucket.spec.objects
        await ctx.update_status(entity_bucket.metadata, entity_bucket.status)
    except Exception as ex:
        raise Exception("Unable to execute object add intent handler: " + str(ex))

async def on_object_removed(ctx, entity_bucket, diff):
    try:
        papiea_test.logger.debug("Executing object removed from bucket intent handler...")

        async with papiea_test.get_client(papiea_test.OBJECT_KIND) as object_entity_client:
            entity_object = await object_entity_client.get(AttributeDict(uuid=diff[0].status[0].reference.uuid))

            entity_object.status.references[:] = [d for d in entity_object.status.references
                if d.get("object_name") != diff[0].status[0].name or d.get("bucket_name") != entity_bucket.spec.name]

            if not entity_object.status.references:
                papiea_test.logger.debug("Object refcount is zero. Deleting the object...")
                await object_entity_client.delete(entity_object.metadata)
            else:
                await ctx.update_status(entity_object.metadata, entity_object.status)

        entity_bucket.status.objects = entity_bucket.spec.objects
        await ctx.update_status(entity_bucket.metadata, entity_bucket.status)
    except Exception as ex:
        raise Exception("Unable to execute object remove intent handler: " + str(ex))

async def object_create_handler(ctx, entity_object):
    try:
        papiea_test.logger.debug("Executing object create intent handler...")

        status = AttributeDict(
            content=entity_object.spec.content,
            size=len(entity_object.spec.content),
            last_modified=str(datetime.now(timezone.utc)),
            references=list()
        )
        await ctx.update_status(entity_object.metadata, status)
    except Exception as ex:
        raise Exception("Unable to execute object create intent handler: " + str(ex))

async def object_content_handler(ctx, entity_object, diff):
    try:
        papiea_test.logger.debug("Executing object content change intent handler...")

        status = AttributeDict(
            content=entity_object.spec.content,
            size=len(entity_object.spec.content),
            last_modified=str(datetime.now(timezone.utc)),
            references=entity_object.status.references
        )
        await ctx.update_status(entity_object.metadata, status)
    except Exception as ex:
        raise Exception("Unable to execute object content change intent handler: " + str(ex))
