import { Collection, Db } from "mongodb";
import Logger from "../logger_interface";
import { SessionKeyDb } from "./session_key_db_interface"
import { SessionKey } from "papiea-core"

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
        await this.collection.insertOne(sessionKey);
        return;
    }

    async get_key(key: string): Promise<SessionKey> {
        const result: SessionKey | null = await this.collection.findOne({
            "key": key,
        });
        if (result === null) {
            throw new Error("key not found");
        }
        return result;
    }

    async inactivate_key(key: string): Promise<void> {
        const result = await this.collection.deleteOne({
            "key": key
        }, );
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed to inactivate key");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error(`Amount of key inactivated must be 0 or 1, found: ${result.result.n}`);
        }
        return;
    }
}
