import { ClientSession, Collection, Db, MongoClient } from "mongodb"
import { Graveyard_DB } from "./graveyard_db_interface"
import { Logger } from 'papiea-backend-utils'
import { Provider_Entity_Reference, Entity, Metadata, PapieaEngineTags } from "papiea-core";
import { SortParams } from "../entity/entity_api_impl"
import { build_filter_query } from "./utils/filtering"
import { PapieaException } from "../errors/papiea_exception";

export class Graveyard_DB_Mongo implements Graveyard_DB {
    collection: Collection
    logger: Logger
    entity_collection: Collection
    client: MongoClient

    constructor(logger: Logger, db: Db, client: MongoClient) {
        this.collection = db.collection("graveyard")
        this.entity_collection = db.collection("entity")
        this.logger = logger
        this.client = client
    }

    async dispose(entity: Entity): Promise<void> {
        // TODO: this is a transaction operation
        // TODO: Mongo only allows transactions on replica sets
        // const session = this.client.startSession()
        // this.session = session
        // try {
        //     await session.withTransaction(async () => {
        //
        //         await this.save_to_graveyard(entity);
        //         await this.delete_entity(entity.metadata);
        //     });
        // } finally {
        //     this.session = undefined
        //     await session.endSession();
        // }
        this.logger.debug(`BEGIN ${this.dispose.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        await this.save_to_graveyard(entity);
        await this.delete_entity(entity.metadata);
        this.logger.debug(`END ${this.dispose.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
    }

    async delete_entity(entity_ref: Provider_Entity_Reference): Promise<void> {
        this.logger.debug(`BEGIN ${this.delete_entity.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.entity_collection.deleteOne(
            {
                "metadata.uuid": entity_ref.uuid,
                "metadata.kind": entity_ref.kind,
                "metadata.provider_prefix": entity_ref.provider_prefix,
                "metadata.provider_version": entity_ref.provider_version
            })
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new PapieaException(`MongoDBError: Failed to remove entity for kind ${entity_ref.provider_prefix}/${entity_ref.provider_version}/${entity_ref.kind}`, { provider_prefix: entity_ref.provider_prefix, provider_version: entity_ref.provider_version, kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }});
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new PapieaException(`MongoDBError: Amount of entities deleted must be 0 or 1, found: ${result.result.n} for kind ${entity_ref.provider_prefix}/${entity_ref.provider_version}/${entity_ref.kind}`, { provider_prefix: entity_ref.provider_prefix, provider_version: entity_ref.provider_version, kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }});
        }
        this.logger.debug(`END ${this.delete_entity.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        return;
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex(
                { "metadata.uuid": 1, "metadata.provider_version": 1,
                    "metadata.kind": 1, "metadata.provider_prefix": 1, "metadata.deleted_at": 1 },
                { unique: true },
            )
        } catch (err) {
            throw err
        }
    }

    async save_to_graveyard(entity: Entity): Promise<void> {
        this.logger.debug(`BEGIN ${this.save_to_graveyard.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        entity.metadata.spec_version++
        entity.metadata.deleted_at = new Date()
        const result = await this.collection.insertOne(entity)
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of saved entries doesn't equal to 1: ${result.result.n} for kind ${entity.metadata.provider_prefix}/${entity.metadata.provider_version}/${entity.metadata.kind}`, { provider_prefix: entity.metadata.provider_prefix, provider_version: entity.metadata.provider_version, kind_name: entity.metadata.kind, additional_info: { "entity_uuid": entity.metadata.uuid }})
        }
        this.logger.debug(`END ${this.save_to_graveyard.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
    }

    async list_entities(fields_map: any, exact_match: boolean, sortParams?: SortParams): Promise<Entity[]> {
        this.logger.debug(`BEGIN ${this.list_entities.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        const filter = build_filter_query(this.logger, fields_map, exact_match)
        if (filter["metadata.deleted_at"] === null) {
            delete filter["metadata.deleted_at"]
        }
        if (sortParams) {
            this.logger.debug(`END ${this.list_entities.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
            return await this.collection.find(filter).sort(sortParams).toArray();
        } else {
            this.logger.debug(`END ${this.list_entities.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
            return await this.collection.find(filter).toArray();
        }
    }

    async get_entity(entity_ref: Provider_Entity_Reference): Promise<Entity> {
        this.logger.debug(`BEGIN ${this.get_entity.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.findOne(
            {
                "metadata.uuid": entity_ref.uuid,
                "metadata.provider_prefix": entity_ref.provider_prefix,
                "metadata.provider_version": entity_ref.provider_version,
                "metadata.kind": entity_ref.kind
            }
        );
        if (result === null) {
            throw new PapieaException(`MongoDBError: Could not find entity of kind ${entity_ref.provider_prefix}/${entity_ref.provider_version}/${entity_ref.kind}`, { provider_prefix: entity_ref.provider_prefix, provider_version: entity_ref.provider_version, kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }});
        }
        this.logger.debug(`END ${this.get_entity.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        return result;
    }

    // The function returns a maximum spec version in the graveyard
    // If there is no corresponding record in the graveyard, function returns 0
    async get_highest_spec_version(entity_ref: Provider_Entity_Reference): Promise<number> {
        this.logger.debug(`BEGIN ${this.get_highest_spec_version.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.find(
            {
                "metadata.uuid": entity_ref.uuid,
                "metadata.provider_prefix": entity_ref.provider_prefix,
                "metadata.provider_version": entity_ref.provider_version,
                "metadata.kind": entity_ref.kind
            }
        ).sort({"metadata.spec_version": -1}).limit(1).toArray()
        if (result[0]) {
            this.logger.debug(`END ${this.get_highest_spec_version.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
            return result[0].metadata.spec_version
        } else {
            this.logger.debug(`END ${this.get_highest_spec_version.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
            return 0
        }
    }

    async check_spec_version_exists(metadata: Metadata, spec_version: number): Promise<boolean> {
        this.logger.debug(`BEGIN ${this.check_spec_version_exists.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.findOne(
            {
                "metadata.uuid": metadata.uuid,
                "metadata.provider_prefix": metadata.provider_prefix,
                "metadata.provider_version": metadata.provider_version,
                "metadata.kind": metadata.kind,
                "metadata.spec_version": spec_version
            }
        );
        this.logger.debug(`END ${this.check_spec_version_exists.name} in graveyard database`, { tags: [PapieaEngineTags.Database] })
        return result !== null;

    }
}
