import { Policy_DB } from "./policy_db_interface";
import { Policy } from "papiea-core";
import { Collection, Db } from "mongodb";
import { Logger } from "../logger_interface"

export class Policy_DB_Mongo implements Policy_DB {
    collection: Collection;
    logger: Logger;

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("policy");
        this.logger = logger;
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex({
                "uuid": 1,
            }, { unique: true });
        } catch (err) {
            throw err;
        }
    }

    async create_policy(policy: Policy): Promise<void> {
        await this.collection.insertOne(policy);
        return;
    };

    async get_policy(uuid: string): Promise<Policy> {
        const result: Policy | null = await this.collection.findOne({
            "uuid": uuid,
        });
        if (result === null) {
            throw new Error("key not found");
        }
        return result;
    };

    async list_policies(fields_map: any): Promise<Policy[]> {
        const filter: any = Object.assign({}, fields_map);
        const result = await this.collection.find(filter).toArray();
        return result;
    };

    async delete_policy(uuid: string): Promise<void> {
        await this.collection.deleteOne({uuid: uuid});
        return;
    };

    async update_policy(filter: any, update: any): Promise<void> {
        await this.collection.updateOne(filter, update);
        return; 
    }
}