import { Status_DB } from "./status_db_interface";
import { Db, Collection } from "mongodb";
import { datestringToFilter } from "./utils/date";
import { encode } from "mongo-dot-notation-tool"
import { Entity_Reference, Status, Metadata, Entity } from "papiea-core";
import { SortParams } from "../utils/utils";

export class Status_DB_Mongo implements Status_DB {
    collection: Collection;

    constructor(db: Db) {
        this.collection = db.collection("entity");
    }

    async init(): Promise<void> {
        await this.collection.createIndex(
            { "metadata.uuid": 1 },
            { name: "entity_uuid", unique: true }
        );
    }

    async replace_status(entity_ref: Entity_Reference, status: Status): Promise<void> {
        const result = await this.collection.updateOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, {
                $set: {
                    "status": status
                },
                $setOnInsert: {
                    "metadata.created_at": new Date()
                }
            }, {
                upsert: true
            });
        if (result.result.n !== 1) {
            throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`)
        }
    }

    async update_status(entity_ref: Entity_Reference, status: Status): Promise<void> {
        const partial_status_query = encode({"status": status});
        const result = await this.collection.updateOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, {
                $set: partial_status_query
            });
        if (result.result.n !== 1) {
            throw new Error(`Amount of updated entries doesn't equal to 1: ${result.result.n}`)
        }
    }

    async get_status(entity_ref: Entity_Reference): Promise<[Metadata, Status]> {
        const result: Entity | null = await this.collection.findOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        });
        if (result === null) {
            throw new Error("Not found")
        }
        return [result.metadata, result.status]
    }

    async list_status(fields_map: any, sortParams: SortParams): Promise<([Metadata, Status])[]> {
        const filter: any = {};
        filter["metadata.deleted_at"] = datestringToFilter(fields_map.metadata.deleted_at);
        for (let key in fields_map.metadata) {
            if (key === "deleted_at")
                continue;
            filter["metadata." + key] = fields_map.metadata[key];
        }
        // Allow filter statuses by metadata and spec
        for (let key in fields_map.spec) {
            filter["spec." + key] = fields_map.spec[key];
        }
        for (let key in fields_map.status) {
            filter["status." + key] = fields_map.status[key];
        }
        const result = await this.collection.find(filter).sort(sortParams).toArray();
        return result.map((x: any): [Metadata, Status] => {
            if (x.status !== null) {
                return [x.metadata, x.status]
            } else {
                throw new Error("No entities found")
            }
        });
    }

    async delete_status(entity_ref: Entity_Reference): Promise<void> {
        const result = await this.collection.updateOne({
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        }, {
                $set: {
                    "metadata.deleted_at": new Date()
                }
            });
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed to remove status");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error("Amount of entities must be 0 or 1");
        }
        return;
    }
}
