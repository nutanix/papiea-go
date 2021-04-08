import { Collection, Db } from "mongodb";
import { SessionKeyDb } from "./session_key_db_interface"
import { PapieaEngineTags, SessionKey, Secret } from "papiea-core"
import { Logger } from "papiea-backend-utils"
import { PapieaException } from "../errors/papiea_exception";

export class SessionKeyDbMongo implements SessionKeyDb {
    collection: Collection;
    logger: Logger;

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("session_key");
        this.logger = logger;
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex(
                { "key": 1 },
                { name: "key", unique: true },
            );
            await this.collection.createIndex(
                { "expireAt": 1 },
                { expireAfterSeconds: 60 * 60 * 24 * 3 },
            );
        } catch (err) {
            throw err
        }
    }

    async create_key(sessionKey: SessionKey): Promise<void> {
        this.logger.debug(`BEGIN ${this.create_key.name} in session key database`, { tags: [PapieaEngineTags.Database] })
        await this.collection.insertOne(sessionKey);
        this.logger.debug(`END ${this.create_key.name} in session key database`, { tags: [PapieaEngineTags.Database] })
        return;
    }

    async get_key(key: Secret): Promise<SessionKey> {
        this.logger.debug(`BEGIN ${this.get_key.name} in session key database`, { tags: [PapieaEngineTags.Database] })
        const result: SessionKey | null = await this.collection.findOne({
            "key": key,
        });
        if (result === null) {
            throw new PapieaException("MongoDBError: Key not found");
        }
        this.logger.debug(`END ${this.get_key.name} in session key database`, { tags: [PapieaEngineTags.Database] })
        return result;
    }

    async inactivate_key(key: Secret): Promise<void> {
        this.logger.debug(`BEGIN ${this.inactivate_key.name} in session key database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.deleteOne({
            "key": key
        }, );
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new PapieaException("MongoDBError: Failed to inactivate key");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new PapieaException(`MongoDBError: Amount of key inactivated must be 0 or 1, found: ${result.result.n}`);
        }
        this.logger.debug(`END ${this.inactivate_key.name} in session key database`, { tags: [PapieaEngineTags.Database] })
        return;
    }

    async update_key(key: Secret, query: any): Promise<void> {
        this.logger.debug(`BEGIN ${this.update_key.name} in session key database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.updateOne({
            "key": key
        }, {
            $set: query
        })
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of updated entries doesn't equal to 1, got: ${result.result.n}`)
        }
        this.logger.debug(`END ${this.update_key.name} in session key database`, { tags: [PapieaEngineTags.Database] })
    }
}
