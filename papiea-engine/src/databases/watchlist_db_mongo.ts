import { Collection, Db } from "mongodb";
import { Logger } from "papiea-backend-utils";
import {Watchlist, Watchlist_DB} from "./watchlist_db_interface"
import { PapieaException } from "../errors/papiea_exception";
import {Backoff, Diff, Entity, Provider_Entity_Reference} from "papiea-core"
import {WatchlistEntityNotFoundError} from "./utils/errors"

type WatchlistEntry = {
    entry_reference: string,
    diffs: Diff[]
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

    private static get_entity_reference(entry: string): Provider_Entity_Reference {
        const [provider_prefix, provider_version, kind, uuid] = entry.split("/")
        return {
            provider_prefix,
            provider_version,
            kind,
            uuid
        }
    }

    async init(): Promise<void> {
    }

    async add_entity(entity: Entity, diffs: Diff[] = []): Promise<void> {
        const entry: WatchlistEntry = {
            entry_reference: Watchlist_Db_Mongo.get_entry_reference(entity.metadata),
            diffs
        }
        const result = await this.collection.insertOne(entry);
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of created entries doesn't equal to 1: ${result.result.n}`)
        }
    }

    async get_watchlist(): Promise<Watchlist> {
        const watchlist_entries: WatchlistEntry[] = await this.collection.find({}).toArray()
        const watchlist: Watchlist = new Map()
        for (let entry of watchlist_entries) {
            const entity_ref = Watchlist_Db_Mongo.get_entity_reference(entry.entry_reference)
            if (!watchlist.has(entity_ref)) {
                watchlist.set(entity_ref, entry.diffs)
            }
        }
        return watchlist
    }

    async get_entity_diffs(entity_ref: Provider_Entity_Reference): Promise<Diff[]> {
        const watchlist_entries: WatchlistEntry | null = await this.collection.findOne({
            entry_reference: Watchlist_Db_Mongo.get_entry_reference(entity_ref)
        })
        if (watchlist_entries === null) {
            throw new WatchlistEntityNotFoundError(entity_ref.kind, entity_ref.uuid, entity_ref.provider_prefix, entity_ref.provider_version)
        }
        return watchlist_entries.diffs
    }

    async add_diff(entity_reference: Provider_Entity_Reference, diff: Diff) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.get_entry_reference(entity_reference)},
            {$push: {diffs: diff}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of updated entries doesn't equal to 1, got: ${result.result.n}`)
        }
    }

    async add_diffs(entity_reference: Provider_Entity_Reference, diffs: Diff[]) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.get_entry_reference(entity_reference)},
            {$push: {diffs: {$each: diffs}}}
        )
        if (result.result.ok !== 1) {
            throw new PapieaException(`MongoDBError: Unable to add multiple diffs`, {
                additional_info: {
                    entity_uuid: entity_reference.uuid
                }
            })
        }
    }

    async update_diff_backoff(entity_reference: Provider_Entity_Reference, diff_id: string, backoff: Backoff) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.get_entry_reference(entity_reference), "diffs.id": diff_id},
            {$set: {"diffs.$.backoff": backoff}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of updated entries doesn't equal to 1, got: ${result.result.n}`)
        }
    }

    async remove_diff(entity_reference: Provider_Entity_Reference, diff: Diff) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.get_entry_reference(entity_reference)},
            {$pull: {diffs: {id: diff.id}}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of updated entries doesn't equal to 1, got: ${result.result.n}`)
        }
    }

    async remove_entity(entity_reference: Provider_Entity_Reference) {
        const entry = Watchlist_Db_Mongo.get_entry_reference(entity_reference)
        const result = await this.collection.deleteOne({entry_reference: entry});
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
