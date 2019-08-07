import { Spec_DB } from "./spec_db_interface";
import { Collection, Db } from "mongodb";
import { ConflictingEntityError, EntityNotFoundError } from "./utils/errors";
import { datestringToFilter } from "./utils/date";
import { encode } from "mongo-dot-notation-tool";
import { Entity_Reference, Metadata, Spec, Entity } from "papiea-core";
import { SortParams } from "../entity/entity_api_impl";
import Logger from "../logger_interface";

export class Spec_DB_Mongo implements Spec_DB {
    collection: Collection;
    logger: Logger;

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("entity");
        this.logger = logger;
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex(
                { "metadata.uuid": 1 },
                { name: "entity_uuid", unique: true },
            );
        } catch (err) {
            throw err
        }
    }

    async update_spec(entity_metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        let additional_fields: any = {};
        if (entity_metadata.extension !== undefined) {
            additional_fields = encode({"metadata.extension": entity_metadata.extension});
        }
        additional_fields["metadata.created_at"] = new Date();
        const filter = {
            "metadata.uuid": entity_metadata.uuid,
            "metadata.kind": entity_metadata.kind,
            "metadata.spec_version": entity_metadata.spec_version
        };
        try {
            const result = await this.collection.updateOne(filter, {
                $inc: {
                    "metadata.spec_version": 1
                },
                $set: {
                    "spec": spec
                },
                $setOnInsert: additional_fields
            }, {
                    upsert: true
                });
            if (result.result.n !== 1) {
                throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`)
            }
            return this.get_spec({ uuid: entity_metadata.uuid, kind: entity_metadata.kind });
        } catch (err) {
            if (err.code === 11000) {
                const entity_ref: Entity_Reference = { uuid: entity_metadata.uuid, kind: entity_metadata.kind };
                const [metadata, spec] = await this.get_spec(entity_ref);
                throw new ConflictingEntityError("Spec with this version already exists", metadata, spec);
            } else {
                throw err;
            }
        }
    }

    async get_spec(entity_ref: Entity_Reference): Promise<[Metadata, Spec]> {
        const result: Entity | null = await this.collection.findOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind,
            "metadata.deleted_at": null
        });
        if (result === null) {
            throw new EntityNotFoundError(entity_ref.kind, entity_ref.uuid)
        }
        return [result.metadata, result.spec];
    }

    async list_specs(fields_map: any, sortParams?: SortParams): Promise<([Metadata, Spec])[]> {
        const filter: any = {};
        filter["metadata.deleted_at"] = datestringToFilter(fields_map.metadata.deleted_at);
        for (let key in fields_map.metadata) {
            if (key === "deleted_at")
                continue;
            filter["metadata." + key] = fields_map.metadata[key];
        }
        for (let key in fields_map.spec) {
            filter["spec." + key] = fields_map.spec[key];
        }
        for (let key in fields_map.status) {
            filter["status." + key] = fields_map.status[key];
        }
        let result: any[];
        if (sortParams) {
            result = await this.collection.find(filter).sort(sortParams).toArray();
        } else {
            result = await this.collection.find(filter).toArray();
        }
        return result.map((x: any): [Metadata, Spec] => {
            if (x.spec !== null) {
                return [x.metadata, x.spec]
            } else {
                throw new Error("No valid entities found");
            }
        });
    }

    async delete_spec(entity_ref: Entity_Reference): Promise<void> {
        const result = await this.collection.updateOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, {
                $set: {
                    "metadata.deleted_at": new Date()
                }
            });
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed to remove spec");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error(`Amount of entities deleted must be 0 or 1, found: ${result.result.n}`);
        }
        return;
    }
}
