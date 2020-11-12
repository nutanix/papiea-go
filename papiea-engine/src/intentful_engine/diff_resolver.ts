// [[file:~/work/papiea-js/Papiea-design.org::*/src/intentful_engine/task_manager_interface.ts][/src/intentful_engine/task_manager_interface.ts:1]]
import { calculateBackoff, timeout } from "../utils/utils"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { create_entry, Backoff, EntryReference, Watchlist, Delay } from "./watchlist"
import { Watchlist_DB } from "../databases/watchlist_db_interface";
import { Differ, Diff, Metadata, Spec, Status, Kind, Provider } from "papiea-core";
import { Provider_DB } from "../databases/provider_db_interface";
import axios from "axios"
import { IntentfulContext } from "../intentful_core/intentful_context";
import { Logger } from "papiea-backend-utils";
import deepEqual = require("deep-equal");

type DiffContext = {
    metadata: Metadata,
    provider: Provider,
    kind: Kind,
    spec: Spec,
    status: Status,
};
type RediffResult = {diffs: Diff[]} & DiffContext;
type DiffWithContext = {diff: Diff} & DiffContext;

export class DiffResolver {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    private readonly watchlistDb: Watchlist_DB
    private readonly providerDb: Provider_DB
    protected watchlist: Watchlist
    private differ: Differ
    private intentfulContext: IntentfulContext;
    private logger: Logger;
    private batchSize: number;
    private static MAXIMUM_BACKOFF = 100
    private entropyFn: (diff_delay?: number) => number

    constructor(watchlist: Watchlist, watchlistDb: Watchlist_DB, specDb: Spec_DB, statusDb: Status_DB, providerDb: Provider_DB, differ: Differ, intentfulContext: IntentfulContext, logger: Logger, batchSize: number, entropyFn: (diff_delay?: number) => number) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.watchlistDb = watchlistDb
        this.providerDb = providerDb
        this.watchlist = watchlist
        this.differ = differ
        this.intentfulContext = intentfulContext
        this.logger = logger
        this.batchSize = batchSize
        this.entropyFn = entropyFn
    }

    public async run(delay: number) {
        try {
            await this._run(delay)
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    private async _run(delay: number) {
        while (true) {
            await timeout(delay)
            await this.updateWatchlist()
            await this.resolveDiffs()
            await this.addRandomEntities()
        }
    }

    private async updateWatchlist() {
        try {
            const updated_watchlist = await this.watchlistDb.get_watchlist()
            this.watchlist.update(updated_watchlist)
        } catch (e) {
            return
        }
    }

    private createDiffBackoff(kind: Kind, delay: Delay | null | undefined, retries: number = 0): Backoff {
        if (delay !== undefined && delay !== null) {
            return {
                delay,
                retries
            }
        } else {
            return {
                delay: {
                    delay_seconds: calculateBackoff(retries, DiffResolver.MAXIMUM_BACKOFF, this.entropyFn(kind.diff_delay)),
                    delay_set_time: new Date()
                },
                retries
            }
        }
    }

    private incrementDiffBackoff(backoff: Backoff, delay: Delay | null | undefined, kind: Kind): Backoff {
        const retries = backoff.retries + 1
        return this.createDiffBackoff(kind, delay, retries)
    }

    private async rediff(entry_reference: EntryReference): Promise<RediffResult | null> {
        try {
            const [metadata, spec] = await this.specDb.get_spec(entry_reference.entity_reference)
            let [, status] = await this.statusDb.get_status({...entry_reference.provider_reference, ...entry_reference.entity_reference})
            const provider = await this.providerDb.get_provider(entry_reference.provider_reference.provider_prefix, entry_reference.provider_reference.provider_version)
            const kind = this.providerDb.find_kind(provider, metadata.kind)
            const schemas: any = Object.assign({}, kind.kind_structure);
            status = this.remove_status_only_fields(schemas[kind.name], status);
            return {
                diffs: this.differ.all_diffs(kind, spec, status),
                metadata, provider, kind, spec, status,
            };
        } catch (e) {
            this.logger.debug(`Couldn't rediff entity with uuid ${entry_reference.entity_reference.uuid}: ${e}. Removing from watchlist`)
            return null
        }
    }

    private remove_status_only_fields(schema: any, status: Status): Status {
        if (schema) {
            // Return null for fields that are status-only
            if (schema.hasOwnProperty('x-papiea') && schema['x-papiea'] === 'status-only') {
                return null
            }
            if (schema.type === 'object' && status && Object.keys(status).length !== 0) {
                const properties = schema['properties']
                for (let name in properties) {
                    status[name] = this.remove_status_only_fields(properties[name], status[name])
                    // If received null i.e. a status-only field, delete the field from status object
                    if (status[name] === null) {
                        delete status[name]
                    }
                }
            } else if (schema.type === 'array' && status && status.length !== 0) {
                let i = 0;
                // Loop through all values in array and inspect status-only for each
                for (let item of status) {
                    status[i] = this.remove_status_only_fields(schema['items'], item)
                    i++
                }
                // If the array element has all status-only fields, it would be set to empty object
                // based on the above logic, so remove the element from array to avoid empty values.
                status = status.filter((item: any) => Object.keys(item).length !== 0);
            }
        }
        return status
    }

    private async launchOperation({diff, metadata, spec, status}: DiffWithContext): Promise<Delay | null> {
        this.logger.debug("launchOperation", diff.intentful_signature.procedure_callback,
            { metadata: metadata,
                spec: spec,
                status: status,
                input: diff.diff_fields})
        // This yields delay
        const result = await axios.post(diff.intentful_signature.procedure_callback, {
            metadata: metadata,
            spec: spec,
            status: status,
            input: diff.diff_fields
        })
        if (result.data !== null && result.data !== undefined && result.data.delay_secs !== undefined
            && result.data.delay_secs !== null && !Number.isNaN(result.data.delay_secs)) {
            return {
                delay_seconds: result.data.delay_secs,
                delay_set_time: new Date()
            }
        } else {
            return null
        }
    }

    private async checkHealthy(diff: Diff): Promise<boolean> {
        try {
            await axios.get(diff.handler_url!)
            return true
        } catch (e) {
            return false
        }
    }

    private async removeFromWatchlist(ref: EntryReference) {
        this.watchlist.delete(ref)
        await this.watchlistDb.update_watchlist(this.watchlist)
    }

    private static includesDiff(diffs: Diff[], diff: Diff) {
        for (let d of diffs) {
            if (deepEqual(d, diff)) {
                return true
            }
        }
        return false
    }

    private async resolveDiffs() {
        const entries = this.watchlist.entries()

        for (let key in entries) {
            if (!entries.hasOwnProperty(key)) {
                continue
            }

            let [entry_reference, diff_results] = entries[key]
            this.logger.debug(`Diff engine processing ${entry_reference.provider_reference.provider_prefix}/${entry_reference.provider_reference.provider_version}/${entry_reference.entity_reference.kind} entity with uuid: ${entry_reference.entity_reference.uuid}`)
            let rediff: RediffResult | null = await this.rediff(entry_reference)
            if (!rediff) {
                await this.removeFromWatchlist(entry_reference)
                continue
            }
            if (diff_results.length === 0) {
                if (rediff.diffs.length === 0) {
                    await this.removeFromWatchlist(entry_reference)
                    continue
                }
            }
            if (rediff.diffs.length > diff_results.length) {
                for (let diff of rediff.diffs) {
                    const watched_diffs = diff_results.map(watch => watch[0])
                    if (!DiffResolver.includesDiff(watched_diffs, diff)) {
                        entries[key][1].push([diff, null])
                    }
                }
            } else if (diff_results.length > rediff.diffs.length) {
                const watched_diffs = diff_results.map(watch => watch[0])
                for (let idx = 0; idx <= watched_diffs.length; idx++) {
                    if (!DiffResolver.includesDiff(rediff.diffs, watched_diffs[idx])) {
                        entries[key][1].splice(idx, 1)
                    }
                }
            }
            await this.startDiffsResolution(diff_results, rediff)
        }
        await this.watchlistDb.update_watchlist(this.watchlist)
    }

    private async calculate_batch_size(): Promise<number> {
        return this.batchSize
    }

    private async startDiffsResolution(diff_results: [Diff, Backoff | null][], rediff: RediffResult) {
        const {diffs, metadata, provider, kind} = rediff
        let next_diff: Diff
        let idx: number
        const diff_selection_strategy = this.intentfulContext.getDiffSelectionStrategy(kind!)
        try {
            [next_diff, idx] = diff_selection_strategy.selectOne(diffs)
        } catch (e) {
            this.logger.debug(`Entity with uuid ${metadata!.uuid}: ${e}`)
            return null
        }
        const backoff: Backoff | null = diff_results[idx][1]
        if (!backoff) {
            diff_results[idx][0].handler_url = `${next_diff.intentful_signature.base_callback}/healthcheck`
            try {
                const delay = await this.launchOperation({diff: next_diff, ...rediff})
                const backoff = this.createDiffBackoff(kind, delay)
                this.logger.info(`Starting to resolve diff for ${provider.prefix}/${provider.version}/${kind.name} entity with uuid: ${metadata!.uuid}`)
                diff_results[idx][1] = backoff
            } catch (e) {
                this.logger.debug(`Couldn't invoke handler for entity with uuid ${metadata!.uuid}: ${e}`)
                const backoff = this.createDiffBackoff(kind, null)
                diff_results[idx][1] = backoff
            }
        } else {
            // Delay for rediffing
            if ((new Date().getTime() - backoff.delay.delay_set_time.getTime()) / 1000 > backoff.delay.delay_seconds) {
                const diff_index = rediff.diffs.findIndex(diff => deepEqual(diff.diff_fields, next_diff!.diff_fields))
                // Diff still exists, we should check the health of the handler and retry if healthy
                if (diff_index !== -1) {
                    try {
                        if (!await this.checkHealthy(diff_results[idx][0])) {
                            return
                        }
                        this.logger.info(`Starting to retry resolving diff for entity with uuid: ${rediff.metadata!.uuid}`)
                        const delay = await this.launchOperation({diff: rediff.diffs[diff_index], ...rediff})
                        diff_results[idx][1] = this.incrementDiffBackoff(backoff, delay, rediff.kind)
                    } catch (e) {
                        this.logger.debug(`Couldn't invoke retry handler for entity with uuid ${rediff.metadata!.uuid}: ${e}`)
                        diff_results[idx][1] = this.incrementDiffBackoff(backoff, null, rediff.kind)
                    }
                }
            }
        }
    }

    // This method is needed to avoid race condition
    // when diffs may be added between the check and removing from the watchlist
    // the batch size maybe static or dynamic
    private async addRandomEntities() {
        const batch_size = await this.calculate_batch_size()
        const intentful_kind_refs = await this.providerDb.get_intentful_kinds()
        const entities = await this.specDb.list_random_intentful_specs(batch_size, intentful_kind_refs)

        for (let [metadata, _] of entities) {
            const ent = create_entry(metadata)
            if (!this.watchlist.has(ent)) {
                this.watchlist.set([ent, []])
            }
        }
        return this.watchlistDb.update_watchlist(this.watchlist)
    }
}
