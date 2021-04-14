import { Collection, Db } from "mongodb";
import { Logger } from "papiea-backend-utils";
import {Watchlist, Watchlist_DB} from "./watchlist_db_interface"
import { PapieaException } from "../errors/papiea_exception";
import {
    Backoff,
    Diff,
    DiffContent,
    Differ,
    Metadata,
    Provider_Entity_Reference
} from "papiea-core"
import {WatchlistEntityNotFoundError} from "./utils/errors"

type WatchlistEntry = {
    entry_reference: string,
    diffs: Diff[]
}

// TODO: this should be configurable
const N_PER_PAGE = 100

export class Watchlist_Db_Mongo implements Watchlist_DB {
    collection: Collection;
    logger: Logger
    differ: Differ

    constructor(logger: Logger, db: Db, differ: Differ) {
        this.differ = differ
        this.collection = db.collection("watchlist");
        this.logger = logger;
    }

    /** Transform from entity reference to stringified watchlist entry reference */
    private static form_entry_reference(r: Provider_Entity_Reference): string {
        return [
            r.provider_prefix,
            r.provider_version,
            r.kind,
            r.uuid,
        ].join('/')
    }

    /** Transform from stringified entry reference to an object entity reference */
    private static parse_entity_reference(entry: string): Provider_Entity_Reference {
        const [provider_prefix, provider_version, kind, uuid] = entry.split("/")
        return {
            provider_prefix,
            provider_version,
            kind,
            uuid
        }
    }

    async init(): Promise<void> {
        await this.collection.createIndex(
            { "entry_reference": 1 },
            { name: "ref", unique: true },
        )
    }

    /** Adds a new entry to the watchlist */
    async add_entity(metadata: Metadata, diffs: Diff[] = []): Promise<void> {
        const entry: WatchlistEntry = {
            entry_reference: Watchlist_Db_Mongo.form_entry_reference(metadata),
            diffs
        }
        const result = await this.collection.insertOne(entry);
        if (result.result.n) {
            throw new PapieaException({message: `MongoDBError: Couldn't create a watchlist entry. Amount of created entries doesn't equal to 1: ${result.result.n}`})
        }
    }

    async get_watchlist(page_number?: number): Promise<Watchlist> {
        let watchlist_entries: WatchlistEntry[]
        if (page_number) {
            watchlist_entries = await this.collection.find({})
                .sort({_id: 1})
                .skip((page_number - 1) * N_PER_PAGE)
                .limit(N_PER_PAGE)
                .toArray()
        } else {
            watchlist_entries = await this.collection.find({})
                .sort({_id: 1})
                .toArray()
        }
        const watchlist: Watchlist = new Map()
        for (let entry of watchlist_entries) {
            const entity_ref = Watchlist_Db_Mongo.parse_entity_reference(entry.entry_reference)
            if (!watchlist.has(entity_ref)) {
                watchlist.set(entity_ref, entry.diffs)
            }
        }
        return watchlist
    }

    async get_entity_diffs(entity_ref: Provider_Entity_Reference): Promise<Diff[]> {
        const watchlist_entries: WatchlistEntry | null = await this.collection.findOne({
            entry_reference: Watchlist_Db_Mongo.form_entry_reference(entity_ref)
        })
        if (watchlist_entries === null) {
            throw new WatchlistEntityNotFoundError(entity_ref.kind, entity_ref.uuid, entity_ref.provider_prefix, entity_ref.provider_version)
        }
        return watchlist_entries.diffs
    }

    /** Adds diff to an already existing entry */
    async add_diff(entity_reference: Provider_Entity_Reference, diff: Diff) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.form_entry_reference(entity_reference)},
            {$push: {diffs: diff}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException({message: `MongoDBError: Amount of updated entries doesn't equal to 1, got: ${result.result.n}`})
        }
    }

    /** Updating diff fields requires rehashing. */
    async update_diff_fields(entity_reference: Provider_Entity_Reference, diff_id: string, diff_fields: DiffContent[]) {
        let diff: Diff
        const entry_ref = Watchlist_Db_Mongo.form_entry_reference(entity_reference)
        const entry = await this.collection.findOne({entry_reference: entry_ref})
        const found_diffs: Diff[] = entry.diffs.filter((diff: Diff) => diff.id === diff_id)
        if (found_diffs.length !== 0) {
            diff = found_diffs[0]
        } else {
            throw new PapieaException({message: `Unexpected error, while updating diff fields, wrong diff id: ${diff_id} was provided`})
        }
        const {id} = this.differ.create_diff_structure(entity_reference, diff.intentful_signature, diff.diff_fields)
        diff.diff_fields = diff_fields
        diff.id = id
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.form_entry_reference(entity_reference), "diffs.id": diff_id},
            {$set: {"diffs.$": diff}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException({message: `MongoDBError: Couldn't update diff fields. Amount of updated entries doesn't equal to 1, got: ${result.result.n}`})
        }
    }

    /** Adds multiple diff to an already existing entry */
    async add_diffs(entity_reference: Provider_Entity_Reference, diffs: Diff[]) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.form_entry_reference(entity_reference)},
            {$push: {diffs: {$each: diffs}}}
        )
        if (result.result.ok !== 1) {
            throw new PapieaException({message: `MongoDBError: Unable to add multiple diffs`, entity_info: entity_reference})
        }
    }

    /** Updates backoff for an existing diff inside the entry */
    async update_diff_backoff(entity_reference: Provider_Entity_Reference, diff_id: string, backoff: Backoff) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.form_entry_reference(entity_reference), "diffs.id": diff_id},
            {$set: {"diffs.$.backoff": backoff}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException({message: `MongoDBError: Couldn't update diff backoff. Amount of updated entries doesn't equal to 1, got: ${result.result.n}`})
        }
    }

    /** Removes a diff from the entry (not the entry itself) */
    async remove_diff(entity_reference: Provider_Entity_Reference, diff: Diff) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.form_entry_reference(entity_reference)},
            {$pull: {diffs: {id: diff.id}}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException({message: `MongoDBError: Couldn't remove diff. Amount of updated entries doesn't equal to 1, got: ${result.result.n}`})
        }
    }

    /** Removes multiple diffs from the entry (not the entry itself) */
    async remove_diffs(entity_reference: Provider_Entity_Reference, diffs: Diff[]) {
        const result = await this.collection.updateOne(
            {entry_reference: Watchlist_Db_Mongo.form_entry_reference(entity_reference)},
            {$pull: {diffs: {id: {$in: diffs.map(diff => diff.id)}}}}
        )
        if (result.result.n !== 1) {
            throw new PapieaException({message: `MongoDBError: Couldn't remove diffs from entry. Amount of updated entries doesn't equal to 1, got: ${result.result.n}`})
        }
    }

    /** Removes an entry from the watchlist */
    async remove_entity(entity_reference: Provider_Entity_Reference) {
        const entry = Watchlist_Db_Mongo.form_entry_reference(entity_reference)
        const result = await this.collection.deleteOne({entry_reference: entry});
        if (result.deletedCount !== 1) {
            throw new PapieaException({message: `MongoDBError: Failed to remove watchlist entry`, entity_info: entity_reference});
        }
    }
}
