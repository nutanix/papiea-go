import { Spec, uuid4, Metadata, Status } from "papiea-core";
import { EntityLoggingInfo } from "papiea-backend-utils";

export class ConflictingEntityError extends Error {

    existing_metadata: Metadata;
    existing_spec: Spec;
    entity_info: EntityLoggingInfo
    existing_status?: Status

    constructor(msg: string, metadata: Metadata, spec: Spec, status?: Status) {
        super(msg);
        this.existing_metadata = metadata;
        this.existing_spec = spec;
        this.existing_status = status
        const additional_info = { "entity_uuid": metadata.uuid }
        this.entity_info = new EntityLoggingInfo(metadata.provider_prefix, metadata.provider_version, metadata.kind, additional_info);
    }
}

export class GraveyardConflictingEntityError extends ConflictingEntityError {
    private static MESSAGE = "Deleted entity with this uuid and spec version exists"

    highest_spec_version: number
    entity_info: EntityLoggingInfo

    constructor(metadata: Metadata, spec: Spec, highest_spec_version: number, status?: Status) {
        super(GraveyardConflictingEntityError.MESSAGE, metadata, spec, status);
        this.highest_spec_version = highest_spec_version
        const additional_info = { "entity_uuid": metadata.uuid }
        this.entity_info = new EntityLoggingInfo(metadata.provider_prefix, metadata.provider_version, metadata.kind, additional_info);
    }
}

export class EntityNotFoundError extends Error {

    uuid: uuid4;
    kind: string;
    entity_info: EntityLoggingInfo

    constructor(kind: string, uuid: uuid4, provider_prefix: string, provider_version: string) {
        super();
        this.kind = kind;
        this.uuid = uuid;
        const additional_info = { "entity_uuid": uuid }
        this.entity_info = new EntityLoggingInfo(provider_prefix, provider_version, kind, additional_info)
    }
}
