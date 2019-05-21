import { Provider_DB } from "./provider_db_interface";
import { Db, Collection } from "mongodb"
import { Version, Provider } from "papiea-core";

export class Provider_DB_Mongo implements Provider_DB {
    collection: Collection;

    constructor(db: Db) {
        this.collection = db.collection("provider");
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex({
                "prefix": 1,
                "version": 1
            }, { unique: true });
        } catch (err) {
            throw err;
        }
    }

    async save_provider(provider: Provider): Promise<void> {
        delete provider["created_at"];
        const result = await this.collection.updateOne({
                "prefix": provider.prefix,
                "version": provider.version
            }, {
                $set: provider,
                $setOnInsert: {
                    "created_at": new Date()
                }
            },
            {
                upsert: true
            });
        if (result.result.n !== 1) {
            throw new Error(`Amount of updated entries doesn't equal to 1: ${ result.result.n }`)
        }
    }

    async get_provider(provider_prefix: string, version: Version): Promise<Provider> {
        const filter: any = { prefix: provider_prefix, version };
        const provider: Provider | null = await this.collection.findOne(filter);
        if (provider === null) {
            throw new Error(`Provider with prefix ${ provider_prefix } and version ${ version } not found`);
        } else {
            return provider;
        }
    }

    async list_providers(): Promise<Provider[]> {
        return this.collection.find({}).toArray();
    }

    async delete_provider(provider_prefix: string, version: Version): Promise<void> {
        const result = await this.collection.deleteOne({ "prefix": provider_prefix, version });
        if (result.result.n !== 1) {
            throw new Error("Amount of entities deleted is not 1");
        }
        if (result.result.ok !== 1) {
            throw new Error("Failed to remove provider");
        }
        return;
    }

    async get_latest_provider_by_kind(kind_name: string): Promise<Provider> {
        const providers = await this.collection.find({ "kinds.name": kind_name }).sort({ _id : -1 }).toArray()
        if (providers.length === 0) {
            throw new Error(`Provider with kind ${ kind_name } not found`);
        } else {
            return providers[0];
        }
    }

    async find_providers(provider_prefix: string): Promise<Provider[]> {
        return this.collection.find({ "prefix": provider_prefix }).toArray();
    }

    async get_latest_provider(provider_prefix: string): Promise<Provider> {
        const providers = await this.collection.find({ "prefix": provider_prefix }).sort({ _id : -1 }).toArray();
        if (providers.length === 0) {
            throw new Error(`Provider with prefix ${ provider_prefix } not found`);
        } else {
            return providers[0];
        }
    }
}