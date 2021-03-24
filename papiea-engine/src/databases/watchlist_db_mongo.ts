import { Collection, Db } from "mongodb";
import { Logger } from "papiea-backend-utils";
import {Watchlist, Watchlist_DB} from "./watchlist_db_interface"
import { PapieaException } from "../errors/papiea_exception";
import {Diff, Entity, Provider_Entity_Reference} from "papiea-core"

type WatchlistEntry = {
    k: string,
    v: DiffEntry[]
}

type DiffEntry = {
    k: string,
    v: Diff
}

export class Watchlist_Db_Mongo implements Watchlist_DB {
    collection: Collection;
    logger: Logger

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("watchlist");
        this.logger = logger;
    }

    private static get_entry_reference(r: Provider_Entity_Reference): string {
        return [
            r.provider_prefix,
            r.provider_version,
            r.kind,
            r.uuid,
        ].join('/')
    }

    public get_entity_reference(entry: string): Provider_Entity_Reference {
        const [provider_prefix, provider_version, kind, uuid] = entry.split("/")
        return {
            provider_prefix,
            provider_version,
            kind,
            uuid
        }
    }

    private static get_diff_entries(diffs: Diff[]): DiffEntry[] {
        const entries: DiffEntry[] = []
        for (let diff of diffs) {
            entries.push({k: diff.id, v: diff})
        }
        return entries
    }

    async init(): Promise<void> {
    }

    async add_entity(entity: Entity, diffs: Diff[] = []): Promise<void> {
        const entry: WatchlistEntry = {
            k: Watchlist_Db_Mongo.get_entry_reference(entity.metadata),
            v: Watchlist_Db_Mongo.get_diff_entries(diffs)
        }
        const result = await this.collection.insertOne(entry);
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of created entries doesn't equal to 1: ${result.result.n}`)
        }
    }

    async get_watchlist(): Promise<Watchlist> {
        const watchlist_entries: WatchlistEntry[] = await this.collection.find({}).toArray()
        const watchlist: Watchlist = {}
        for (let entry of watchlist_entries) {
            watchlist[entry.k] = {}
            for (let diffs of entry.v) {
                watchlist[entry.k][diffs.k] = diffs.v
            }
        }
        return watchlist
    }

    async add_diff(entity_reference: Provider_Entity_Reference, diff: Diff) {
        const result = await this.collection.updateOne(
            {k: Watchlist_Db_Mongo.get_entry_reference(entity_reference)},
            {$push: {v: {k: diff.id, v: diff}}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of updated entries doesn't equal to 1, got: ${result.result.n}`)
        }
    }

    async remove_entity(entity_reference: Provider_Entity_Reference) {
        const entry = Watchlist_Db_Mongo.get_entry_reference(entity_reference)
        const result = await this.collection.deleteOne({k: entry});
        if (result.deletedCount !== 1) {
            throw new PapieaException(`MongoDBError: Failed to remove watchlist entry`,
                {
                    additional_info: {
                        entity_uuid: entity_reference.uuid
                    }
                });
        }
    }
}
