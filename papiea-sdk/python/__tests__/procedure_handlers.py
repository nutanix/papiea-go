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

    async with ctx.entity_client_for_user(utils.bucket_kind_dict) as entity_client:
        try:
            desired_bucket = await entity_client.filter(AttributeDict(spec=AttributeDict(name=input_bucket_name)))
            if len(desired_bucket.results) != 0:
                papiea_test.logger.debug("Bucket already exists. Returning it...")
                return EntityReference(
                    uuid=desired_bucket.results[0].metadata.uuid,
                    kind=desired_bucket.results[0].metadata.kind
                )
        except Exception as ex:
            raise Exception("Unable to create bucket entity: " + str(ex))

        papiea_test.logger.debug("Bucket not found. Creating new bucket...")    
        try:
            ret_entity = await entity_client.create(
                spec=Spec(name=input_bucket_name, objects=list()),
                metadata_extension={
                    "owner": "nutanix"
                }
            )

            return EntityReference(
                uuid=ret_entity.metadata.uuid,
                kind=ret_entity.metadata.kind
            )
        except Exception as ex:
            raise Exception("Unable to create bucket entity: " + str(ex))

    return EntityReference(uuid="", kind="", message="Unable to create bucket entity")

async def change_bucket_name_handler(ctx, entity_bucket, new_bucket_name):
    # check if there's any bucket with the new name
    # if found, return None/failure
    # else update name and bucket entity
    # fetch unique uuids for the objects in the bucket
    # for each uuid, get the object references list
    # iterate and update bucket name if bucket ref match is found
    # update all such object entities

    async with ctx.entity_client_for_user(utils.bucket_kind_dict) as entity_client:
        try:
            matched_bucket = await entity_client.filter(AttributeDict(spec=AttributeDict(name=new_bucket_name)))
            if len(matched_bucket.results) == 0:

                entity_bucket.spec.name = new_bucket_name
                async with ctx.entity_client_for_user(utils.bucket_kind_dict) as entity_client:
                    await entity_client.update(
                        metadata=entity_bucket.metadata,
                        spec=entity_bucket.spec
                    )

                object_uuid_set = set()
                for obj in entity_bucket.spec.objects:
                    object_uuid_set.add(obj.reference.uuid)

                async with ctx.entity_client_for_user(utils.object_kind_dict) as entity_client:
                    for object_uuid in object_uuid_set:
                        entity_object = await entity_client.get(AttributeDict(uuid=object_uuid))
                        for i in range(len(entity_object.spec.references)):
                            if entity_object.spec.references[i].bucket_reference.uuid == entity_bucket.metadata.uuid:
                                entity_object.spec.references[i].bucket_name = new_bucket_name

                        await entity_client.update(
                            metadata=entity_object.metadata,
                            spec=entity_object.spec
                        )

                return EntityReference(
                    uuid=entity_bucket.metadata.uuid,
                    kind=entity_bucket.metadata.kind
                )
            else:
                raise Exception("Bucket with new name already exists")
        except Exception as ex:
            raise Exception("Unable to change the bucket name: " + str(ex))

    return EntityReference(uuid="", kind="", message="Unable to change name for the bucket entity")

async def create_object_handler(ctx, entity_bucket, input_object_name):
    # check if object name already exists in entity.objects
    # if found, return None/failure
    # else create a new object entity and
    # add the object name and bucket reference in the object' references and
    # add the object name and reference in the objects list

    objects_list = entity_bucket.spec.objects
    if not any(obj.name == input_object_name for obj in objects_list):
        papiea_test.logger.debug("Object not found. Creating new object...")
        async with ctx.entity_client_for_user(utils.object_kind_dict) as entity_client:
            try:
                entity_object = await entity_client.create(
                    Spec(content="",
                        references=[AttributeDict(
                            bucket_name=entity_bucket.spec.name,
                            object_name=input_object_name,
                            bucket_reference=EntityReference(
                                uuid=entity_bucket.metadata.uuid,
                                kind=papiea_test.BUCKET_KIND
                            )
                        )]
                    ),
                    metadata_extension={
                        "owner": "nutanix"
                    }
                )

                entity_bucket.spec.objects.append(
                    AttributeDict(name=input_object_name,
                        reference=EntityReference(
                            uuid=entity_object.metadata.uuid,
                            kind=papiea_test.OBJECT_KIND
                        )
                    )
                )
                async with ctx.entity_client_for_user(utils.bucket_kind_dict) as entity_client:
                    await entity_client.update(
                        metadata=entity_bucket.metadata,
                        spec=entity_bucket.spec
                    )

                return EntityReference(
                    uuid=entity_object.metadata.uuid,
                    kind=entity_object.metadata.kind
                )
            except Exception as ex:
                raise Exception("Unable to create object entity: " + str(ex))
    else:
        raise Exception("Object already exists in the bucket")

    return EntityReference(uuid="", kind="", message="Unable to create object entity")

async def link_object_handler(ctx, entity_bucket, input_object):
    # assuming input_object to be the object name and the uid
    # check if the name already exist in the objects list
    # if exists, return None/failure
    # else add object name and bucket uid in object' references list and
    # add object name and uid in bucket' objects list

    objects_list = entity_bucket.spec.objects
    if not any(obj.name == input_object.object_name for obj in objects_list):
        papiea_test.logger.debug("Object not found. Linking the object...")
        entity_bucket.spec.objects.append(
            AttributeDict(name=input_object.object_name,
                reference=EntityReference(
                    uuid=input_object.object_uuid,
                    kind=papiea_test.OBJECT_KIND
                )
            )
        )

        async with ctx.entity_client_for_user(utils.bucket_kind_dict) as entity_client:
            try:
                await entity_client.update(
                    metadata=entity_bucket.metadata,
                    spec=entity_bucket.spec
                )
            except Exception as ex:
                raise Exception("Unable to link object entity: " + str(ex))

        async with ctx.entity_client_for_user(utils.object_kind_dict) as entity_client:
            try:
                entity_object = await entity_client.get(AttributeDict(uuid=input_object.object_uuid))
            except Exception as ex:
                papiea_test.logger.debug(str(ex))
                raise Exception("Object not found in the bucket")

            entity_object.spec.references.append(
                AttributeDict(
                    bucket_name=entity_bucket.spec.name,
                    object_name=input_object.object_name,
                    bucket_reference=AttributeDict(
                        uuid=entity_bucket.metadata.uuid,
                        kind=papiea_test.BUCKET_KIND
                    )
                )
            )

            try:
                await entity_client.update(
                    metadata=entity_object.metadata,
                    spec=entity_object.spec
                )
                ret_entity = await entity_client.get(entity_object.metadata)
            except Exception as ex:
                raise Exception("Unable to link object entity: " + str(ex))

            return EntityReference(
                uuid=ret_entity.metadata.uuid,
                kind=ret_entity.metadata.kind
            )
    else:
        raise Exception("Object already exists in the bucket")

    return EntityReference(uuid="", kind="", message="Unable to link object entity")

async def unlink_object_handler(ctx, entity_bucket, input_object):
    # assuming input_object to be the object name and the uid
    # check if the name exists in the object list
    # if does not exists, return None/failure
    # else remove the object name and reference from the bucket' objects list and
    # remove the object from the object' references list
    # if the object' references list become empty, delete the object entity

    objects_list = entity_bucket.spec.objects
    if any(obj.name == input_object.object_name for obj in objects_list):
        papiea_test.logger.debug("Object found. Unlinking the object...")
        entity_bucket.spec.objects[:] = [d for d in entity_bucket.spec.objects if d.get("name") != input_object.object_name]
        async with ctx.entity_client_for_user(utils.bucket_kind_dict) as entity_client:
            try:
                await entity_client.update(
                    metadata=entity_bucket.metadata,
                    spec=entity_bucket.spec
                )
            except Exception as ex:
                raise Exception("Unable to unlink object entity: "+ str(ex))

        async with ctx.entity_client_for_user(utils.object_kind_dict) as entity_client:
            try:
                entity_object = await entity_client.get(AttributeDict(uuid=input_object.object_uuid))
                entity_object.spec.references[:] = [d for d in entity_object.spec.references
                    if d.get("object_name") != input_object.object_name or d.get("bucket_name") != entity_bucket.spec.name]

                if not entity_object.spec.references:
                    papiea_test.logger.debug("Object refcount is zero. Deleting the object...")
                    await entity_client.delete(entity_object.metadata)
                    return EntityReference(uuid="", kind="", message="Object has been deleted")

                await entity_client.update(
                    metadata=entity_object.metadata,
                    spec=entity_object.spec
                )
                ret_entity = await entity_client.get(entity_object.metadata)

                return EntityReference(
                    uuid=ret_entity.metadata.uuid,
                    kind=ret_entity.metadata.kind
                )
            except Exception as ex:
                raise Exception("Unable to unlink object entity: " + str(ex))
    else:
        raise Exception("Object not found in the bucket")

    return EntityReference(uuid="", kind="", message="Unable to unlink object entity")

async def bucket_constructor(ctx, entity):
  papiea_test.logger.debug("Inside bucket constructor")
  status = AttributeDict(
      name=entity.spec.name,
      objects=entity.spec.objects
  )
  await ctx.update_status(entity.metadata, status)

async def object_constructor(ctx, entity):
  papiea_test.logger.debug("Inside object constructor")
  status = AttributeDict(
      content=entity.spec.content,
      size=0,
      last_modified=str(datetime.now(timezone.utc)),
      references=list()
  )
  await ctx.update_status(entity.metadata, status)

async def bucket_name_handler(ctx, entity, diff):
    papiea_test.logger.debug("Bucket name change handler invoked")
    await ctx.update_status(entity.metadata, entity.spec)

async def object_content_handler(ctx, entity, diff):
    papiea_test.logger.debug("Object content handler invoked")
    status = AttributeDict(
        content=entity.spec.content,
        size=len(entity.spec.content),
        last_modified=str(datetime.now(timezone.utc)),
        references=entity.status.references
    )
    await ctx.update_status(entity.metadata, status)

async def on_object_added(ctx, entity, diff):
    papiea_test.logger.debug("Object add handler invoked")
    status = AttributeDict(
        name=entity.status.name,
        objects=entity.spec.objects
    )
    await ctx.update_status(entity.metadata, status)

async def on_object_removed(ctx, entity, diff):
    papiea_test.logger.debug("Object remove handler invoked")
    status = AttributeDict(
        name=entity.status.name,
        objects=entity.spec.objects
    )
    await ctx.update_status(entity.metadata, status)