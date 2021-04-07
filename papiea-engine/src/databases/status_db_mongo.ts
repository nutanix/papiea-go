import { Status_DB } from "./status_db_interface";
import { Db, Collection, UpdateWriteOpResult } from "mongodb"
import { EntityStatusUpdateInput, Status, Metadata, Entity, Provider_Entity_Reference } from "papiea-core";
import { SortParams } from "../entity/entity_api_impl";
import { Logger, dotnotation } from "papiea-backend-utils";
import { build_filter_query } from "./utils/filtering"
import { EntityNotFoundError, StatusConflictingEntityError } from "./utils/errors";
import { PapieaException } from "../errors/papiea_exception"
import { getObjectHash } from "../utils/utils"

export class Status_DB_Mongo implements Status_DB {
    collection: Collection;
    logger: Logger

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("entity");
        this.logger = logger;
    }

    async init(): Promise<void> {

    }

    async replace_status(metadata: EntityStatusUpdateInput, status: Status): Promise<[Metadata, Status]> {
        try {
            const current_status_hash = getObjectHash({
                "status": status
            })
            const result = await this.collection.updateOne({
                "metadata.provider_prefix": metadata.provider_prefix,
                "metadata.provider_version": metadata.provider_version,
                "metadata.status_hash": metadata.status_hash,
                "metadata.uuid": metadata.uuid,
                "metadata.kind": metadata.kind
            }, {
                    $set: {
                        "status": status,
                        "metadata.status_hash": current_status_hash
                    },
                    $setOnInsert: {
                        "metadata.created_at": new Date()
                    }
                }, {
                    upsert: true
                });
            if (result.result.n !== 1) {
                throw new PapieaException(`MongoDBError: Amount of updated entries doesn't equal to 1: ${result.result.n} for kind ${metadata.provider_prefix}/${metadata.provider_version}/${metadata.kind}`, { provider_prefix: metadata.provider_prefix, provider_version: metadata.provider_version, kind_name: metadata.kind, additional_info: { "entity_uuid": metadata.uuid }})
            }
            return await this.get_status(metadata)
        } catch (err) {
            /* duplicate key index error */
            if (err.code === 11000) {
                let res:any
                try {
                  res = await this.get_status(metadata);
                } catch (e) {
                    throw new PapieaException(`MongoDBError: Cannot create entity for kind ${metadata.provider_prefix}/${metadata.provider_version}/${metadata.kind}`, { provider_prefix: metadata.provider_prefix, provider_version: metadata.provider_version, kind_name: metadata.kind, additional_info: { "entity_uuid": metadata.uuid }})
                }
                const [updated_metadata, status] = res
                throw new StatusConflictingEntityError(updated_metadata, status);
            }
            throw err
        }
    }

    async update_status(metadata: EntityStatusUpdateInput, status: Status): Promise<[Metadata, Status]> {
        let result: UpdateWriteOpResult
        const partial_status_query = dotnotation({"status": status});

        let aggregrate_fields = []
        const {set_status_fields, unset_status_fields} = separate_null_fields(partial_status_query)
        const current_status_hash = getObjectHash({
            "status": status
        })
        if (Object.keys(set_status_fields).length !== 0) {
            aggregrate_fields.push({ $set: {"metadata.status_hash": current_status_hash, ...set_status_fields} })
        }
        if (Object.keys(unset_status_fields).length !== 0) {
            aggregrate_fields.push({ $unset: unset_status_fields })
        }

        try {
            result = await this.collection.updateOne(
                {
                    "metadata.provider_prefix": metadata.provider_prefix,
                    "metadata.provider_version": metadata.provider_version,
                    "metadata.status_hash": metadata.status_hash,
                    "metadata.uuid": metadata.uuid,
                    "metadata.kind": metadata.kind
                }, aggregrate_fields, {
                    upsert: true
                });
        } catch (err) {
            /* failed to parse input error */
            if (err.code === 9) {
                throw new PapieaException(`MongoDBError: Update body might be 'undefined', if this is expected, please use 'null' for kind ${metadata.provider_prefix}/${metadata.provider_version}/${metadata.kind}`,  { provider_prefix: metadata.provider_prefix, provider_version: metadata.provider_version, kind_name: metadata.kind, additional_info: { "entity_uuid": metadata.uuid }})
            }
            /* duplicate key index error */
            if (err.code === 11000) {
                let res:any
                try {
                  res = await this.get_status(metadata);
                } catch (e) {
                    throw new PapieaException(`MongoDBError: Cannot create entity for kind ${metadata.provider_prefix}/${metadata.provider_version}/${metadata.kind}`, { provider_prefix: metadata.provider_prefix, provider_version: metadata.provider_version, kind_name: metadata.kind, additional_info: { "entity_uuid": metadata.uuid }})
                }
                const [updated_metadata, status] = res
                throw new StatusConflictingEntityError(updated_metadata, status);
            }
            throw err
        }
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of updated entries doesn't equal to 1: ${result.result.n} for kind ${metadata.provider_prefix}/${metadata.provider_version}/${metadata.kind}`,  { provider_prefix: metadata.provider_prefix, provider_version: metadata.provider_version, kind_name: metadata.kind, additional_info: { "entity_uuid": metadata.uuid }})
        }
        return await this.get_status(metadata)
    }

    async get_status(entity_ref: Provider_Entity_Reference): Promise<[Metadata, Status]> {
        const result: Entity | null = await this.collection.findOne({
            "metadata.provider_prefix": entity_ref.provider_prefix,
            "metadata.provider_version": entity_ref.provider_version,
            "metadata.uuid": entity_ref.uuid,
            "metadata.kind": entity_ref.kind
        });
        if (result === null) {
            throw new EntityNotFoundError(entity_ref.kind, entity_ref.uuid, entity_ref.provider_prefix, entity_ref.provider_version);
        }
        return [result.metadata, result.status]
    }

    async get_statuses_by_ref(entity_refs: Provider_Entity_Reference[]): Promise<[Metadata, Status][]> {
        const ids = entity_refs.map(ref => ref.uuid)
        const result = await this.collection.find({
            "metadata.uuid": {
                $in: ids
            }
        }).toArray();
        return result.map((x: any): [Metadata, Status] => {
            if (x.spec !== null) {
                return [x.metadata, x.status]
            } else {
                throw new PapieaException("MongoDBError: No valid entities found");
            }
        });
    }

    async list_status(fields_map: any, exact_match: boolean, sortParams?: SortParams): Promise<([Metadata, Status])[]> {
        const filter = build_filter_query(fields_map, exact_match)
        let result: any[];
        if (sortParams) {
            result = await this.collection.find(filter).sort(sortParams).toArray();
        } else {
            result = await this.collection.find(filter).toArray();
        }
        return result.map((x: any): [Metadata, Status] => {
            if (x.status !== null) {
                return [x.metadata, x.status]
            } else {
                throw new PapieaException("MongoDBError: No entities found while listing status")
            }
        });
    }

    async list_status_in(filter_list: any[], field_name: string = "metadata.uuid"): Promise<([Metadata, Status])[]> {
        const result = await this.collection.find({ [field_name]: { $in: filter_list } }).sort({ "metadata.uuid": 1 }).toArray();
        return result.map((x: any): [Metadata, Status] => {
            if (x.status !== null) {
                return [x.metadata, x.status]
            } else {
                throw new PapieaException("MongoDBError: No valid entities found");
            }
        });
    }
}

function separate_null_fields(status_dot_notation: any): any {
    let set_fields: any = {}
    let unset_fields: any = []

    for (const key in status_dot_notation) {
        if (status_dot_notation[key] === null) {
            unset_fields.push(key)
        } else {
            set_fields[key] = status_dot_notation[key]
        }
    }
    return { set_status_fields: set_fields,
            unset_status_fields: unset_fields }
}