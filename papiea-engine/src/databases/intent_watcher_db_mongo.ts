import { Collection, Db } from "mongodb"
import { SortParams } from "../entity/entity_api_impl"
import { Logger } from 'papiea-backend-utils'
import { IntentWatcher_DB } from "./intent_watcher_db_interface"
import { IntentWatcher, PapieaEngineTags } from "papiea-core"
import { EntityNotFoundError } from "./utils/errors"
import { PapieaException } from "../errors/papiea_exception"

export class IntentWatcher_DB_Mongo implements IntentWatcher_DB {
    collection: Collection;
    logger: Logger;

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("watcher");
        this.logger = logger;
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex(
                { "uuid": 1 },
                { unique: true },
            )
        } catch (err) {
            throw err
        }
    }

    async save_watcher(watcher: IntentWatcher): Promise<void> {
        this.logger.debug(`BEGIN ${this.save_watcher.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
        watcher.created_at = new Date()
        await this.collection.insertOne(watcher);
        this.logger.debug(`END ${this.save_watcher.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
    }

    async get_watcher(uuid: string): Promise<IntentWatcher> {
        this.logger.debug(`BEGIN ${this.get_watcher.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
        const result: IntentWatcher | null = await this.collection.findOne({
            "uuid": uuid,
        });
        if (result === null) {
            throw new EntityNotFoundError('IntentWatcher', uuid);
        }
        this.logger.debug(`END ${this.get_watcher.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
        return result;
    }

    async update_watcher(uuid: string, delta: Partial<IntentWatcher>): Promise<void> {
        this.logger.debug(`BEGIN ${this.update_watcher.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.updateOne({
            uuid
        }, {
            $set: delta
        })
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new PapieaException(`MongoDBError: Failed to update intent watcher with uuid: ${uuid}`);
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new PapieaException(`MongoDBError: Amount of intent watchers updated must be 0 or 1, found: ${result.result.n} for uuid: ${uuid}`);
        }
        this.logger.debug(`END ${this.update_watcher.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
    }


    async list_watchers(fields_map: any, sortParams?: SortParams): Promise<IntentWatcher[]> {
        this.logger.debug(`BEGIN ${this.list_watchers.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
        const filter: any = Object.assign({}, fields_map);
        let ret_list: any
        if (sortParams) {
            ret_list = await this.collection.find(filter).sort(sortParams).toArray();
        } else {
            ret_list = await this.collection.find(filter).toArray();
        }
        this.logger.debug(`END ${this.list_watchers.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
        return ret_list
    }

    async delete_watcher(uuid: string): Promise<void> {
        this.logger.debug(`BEGIN ${this.delete_watcher.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.deleteOne({
            uuid
        })
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new PapieaException(`MongoDBError: Failed to delete intent watcher with uuid: ${uuid}`);
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new PapieaException(`MongoDBError: Amount of deleted intent watchers must be 0 or 1, found: ${result.result.n} for uuid: ${uuid}`);
        }
        this.logger.debug(`END ${this.delete_watcher.name} in intent watcher database`, { tags: [PapieaEngineTags.Database] })
        return;
    }
}
