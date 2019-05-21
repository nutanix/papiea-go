import { Metadata } from "papiea-core/build/core";
import { Spec, uuid4 } from "papiea-core/build/core";

export class ConflictingEntityError extends Error {

    existing_metadata: Metadata;
    existing_spec: Spec;

    constructor(msg: string, metadata: Metadata, spec: Spec) {
        super(msg);
        this.existing_metadata = metadata;
        this.existing_spec = spec;
    }
}

export class EntityNotFoundError extends Error {

    uuid: uuid4;
    kind: string;

    constructor(kind: string, uuid: uuid4) {
        super();
        this.kind = kind;
        this.uuid = uuid;
    }
}