import { S2S_Key_DB } from "./s2skey_db_interface";
import { PapieaEngineTags, S2S_Key, Secret } from "papiea-core";
import { Collection, Db } from "mongodb";
import { datestringToFilter } from "./utils/date";
import { Logger } from "papiea-backend-utils";
import { PapieaException } from "../errors/papiea_exception";

export class S2S_Key_DB_Mongo implements S2S_Key_DB {
    collection: Collection;
    logger: Logger;

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("s2skey");
        this.logger = logger;
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex(
                { "key": 1 },
                { name: "key", unique: true },
            );
            await this.collection.createIndex(
                { "owner": 1, "provider_prefix": 1 },
                { name: "user_provider_keys", unique: false },
            );
            await this.collection.createIndex(
                { "uuid": 1 },
                { name: "uuid", unique: true },
            )
        } catch (err) {
            throw err
        }
    }

    async create_key(s2skey: S2S_Key): Promise<void> {
        this.logger.debug(`BEGIN ${this.create_key.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        s2skey.created_at = new Date();
        s2skey.deleted_at = undefined;
        await this.collection.insertOne(s2skey);
        this.logger.debug(`END ${this.create_key.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        return;
    }

    async get_key(uuid: string): Promise<S2S_Key> {
        this.logger.debug(`BEGIN ${this.get_key.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        const result: S2S_Key | null = await this.collection.findOne({
            "uuid": uuid,
            "deleted_at": null
        });
        if (result === null) {
            throw new PapieaException("MongoDBError: Key not found");
        }
        this.logger.debug(`END ${this.get_key.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        return result;
    }

    async get_key_by_secret(secret: Secret): Promise<S2S_Key> {
        this.logger.debug(`BEGIN ${this.get_key_by_secret.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        const result: S2S_Key | null = await this.collection.findOne({
            "key": secret,
            "deleted_at": null
        });
        if (result === null) {
            throw new PapieaException("MongoDBError: Key not found");
        }
        this.logger.debug(`END ${this.get_key_by_secret.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        return result;
    }


    async list_keys(fields_map: any): Promise<S2S_Key[]> {
        this.logger.debug(`BEGIN ${this.list_keys.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        const filter: any = Object.assign({}, fields_map);
        filter["deleted_at"] = datestringToFilter(fields_map.deleted_at);
        const result = await this.collection.find(filter).toArray();
        this.logger.debug(`END ${this.list_keys.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        return result;
    }

    async inactivate_key(uuid: string): Promise<void> {
        this.logger.debug(`BEGIN ${this.inactivate_key.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.updateOne({
            "uuid": uuid
        }, {
                $set: {
                    "deleted_at": new Date()
                }
            });
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new PapieaException("MongoDBError: Failed to inactivate key");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new PapieaException(`MongoDBError: Amount of key inactivated must be 0 or 1, found: ${result.result.n}`);
        }
        this.logger.debug(`END ${this.inactivate_key.name} in s2s key database`, { tags: [PapieaEngineTags.Database] })
        return;
    }
}
