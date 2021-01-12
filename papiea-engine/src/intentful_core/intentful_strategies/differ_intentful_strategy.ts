import { IntentfulStrategy } from "./intentful_strategy_interface"
import { Spec_DB } from "../../databases/spec_db_interface"
import { Status_DB } from "../../databases/status_db_interface"
import { Action, Differ, Metadata, Spec, IntentWatcher } from "papiea-core"
import { IntentWatcher_DB } from "../../databases/intent_watcher_db_interface"
import { IntentfulStatus } from "papiea-core"
import { Watchlist_DB } from "../../databases/watchlist_db_interface";
import uuid = require("uuid")
import { create_entry } from "../../intentful_engine/watchlist";
import { Graveyard_DB } from "../../databases/graveyard_db_interface"
import { Authorizer, IntentWatcherAuthorizer } from "../../auth/authz"

export class DifferIntentfulStrategy extends IntentfulStrategy {
    protected differ: Differ
    protected intentWatcherDb: IntentWatcher_DB
    protected watchlistDb: Watchlist_DB;
    protected intentWatcherAuthorizer: Authorizer;

    constructor(specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB, differ: Differ, intentWatcherDb: IntentWatcher_DB, watchlistDb: Watchlist_DB, intentWatcherAuthorizer: Authorizer) {
        super(specDb, statusDb, graveyardDb)
        this.differ = differ
        this.intentWatcherDb = intentWatcherDb
        this.watchlistDb = watchlistDb
        this.intentWatcherAuthorizer = intentWatcherAuthorizer
    }

    async update_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        return [updatedMetadata, updatedSpec]
    }

    async update(metadata: Metadata, spec: Spec): Promise<IntentWatcher | null> {
        const [_, status] = await this.statusDb.get_status(metadata)
        let watcher_spec_version = metadata.spec_version + 1
        await this.update_entity(metadata, spec)
        const watcher: IntentWatcher = {
            uuid: uuid(),
            entity_ref: {
                uuid: metadata.uuid,
                kind: metadata.kind,
                provider_prefix: metadata.provider_prefix,
                provider_version: metadata.provider_version,
            },
            diffs: [],
            spec_version: watcher_spec_version,
            user: this.user,
            status: IntentfulStatus.Active,
        }
        for (let diff of this.differ.diffs(this.kind!, spec, status)) {
            watcher.diffs.push(diff)
        }
        await this.intentWatcherAuthorizer.checkPermission(this.user!, watcher, Action.Create)
        console.log("Nitesh - This should not print!!")
        await this.intentWatcherDb.save_watcher(watcher)
        const watchlist = await this.watchlistDb.get_watchlist()
        const ent = create_entry(metadata)
        if (!watchlist.has(ent)) {
            watchlist.set([ent, []])
            await this.watchlistDb.update_watchlist(watchlist)
        }
        return watcher
    }
}
