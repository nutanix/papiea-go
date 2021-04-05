// [[file:~/work/papiea-js/Papiea-design.org::*/src/intentful_engine/task_manager_interface.ts][/src/intentful_engine/task_manager_interface.ts:1]]
import {includesDiff, timeout} from "../utils/utils"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { Watchlist_DB } from "../databases/watchlist_db_interface";
import {
    Differ,
    Diff,
    Metadata,
    Spec,
    Status,
    Kind,
    Provider,
    Provider_Entity_Reference
} from "papiea-core"
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
    private differ: Differ
    private intentfulContext: IntentfulContext;
    private logger: Logger;
    private batchSize: number;
    private entropyFn: (diff_delay?: number) => number
    private calculateBackoffFn: (retries?: number, maximumBackoff?: number, entropy?: number, kind_retry_exponent?: number, kind_name?: string) => number

    constructor(watchlistDb: Watchlist_DB, specDb: Spec_DB, statusDb: Status_DB, providerDb: Provider_DB, differ: Differ, intentfulContext: IntentfulContext, logger: Logger, batchSize: number, entropyFn: (diff_delay?: number) => number, calculateBackoffFn: (retries?: number, maximumBackoff?: number, entropy?: number) => number) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.watchlistDb = watchlistDb
        this.providerDb = providerDb
        this.differ = differ
        this.intentfulContext = intentfulContext
        this.logger = logger
        this.batchSize = batchSize
        this.entropyFn = entropyFn
        this.calculateBackoffFn = calculateBackoffFn
    }

    public async run(delay: number) {
        try {
            await this._run(delay)
        } catch (e) {
            console.error(`Error in run method for diff resolver: ${e}`)
            throw e
        }
    }

    private async _run(delay: number) {
        while (true) {
            await timeout(delay)
            await this.update_diffs()
            await this.resolve_diffs()
            await this.add_random_entities()
        }
    }

    private async rediff(entity_reference: Provider_Entity_Reference): Promise<RediffResult | null> {
        try {
            // TODO: Reminder - this might be in a wrong order and cause a bug!
            const [metadata, spec] = await this.specDb.get_spec(entity_reference)
            const [, status] = await this.statusDb.get_status(entity_reference)
            const provider = await this.providerDb.get_provider(entity_reference.provider_prefix, entity_reference.provider_version)
            const kind = this.providerDb.find_kind(provider, metadata.kind)

            return {
                diffs: this.differ.all_diffs(entity_reference, kind, spec, status, this.logger),
                metadata, provider, kind, spec, status,
            };
        } catch (e) {
            this.logger.debug(`Couldn't generate diff for entity with uuid: ${entity_reference.uuid} and kind: ${entity_reference.kind} due to error: ${e}. Removing from watchlist`)
            return null
        }
    }

    private async launch_handler({diff, metadata, spec, status}: DiffWithContext) {
        this.logger.debug("launch_handler", diff.intentful_signature.procedure_callback,
            {
                metadata: metadata,
                spec: spec,
                status: status,
                input: diff.diff_fields,
                id: diff.id,
            })
        // This yields delay
        return axios.post(diff.intentful_signature.procedure_callback, {
            metadata: metadata,
            spec: spec,
            status: status,
            input: diff.diff_fields,
            id: diff.id
        })
    }

    private async update_diffs() {
        let watchlist = await this.watchlistDb.get_watchlist()
        for (const [entity_reference, existing_diffs] of watchlist.entries()) {
            console.log(`UPDATE - Entity ref: ${JSON.stringify(entity_reference)}`)
            console.log(`UPDATE - Existing Diffs: ${JSON.stringify(existing_diffs)}`)
            this.logger.debug(`Diff engine resolving diffs for entity with uuid: ${entity_reference.uuid} and kind: ${entity_reference.kind}`)
            let rediff: RediffResult | null = await this.rediff(entity_reference)
            if (!rediff || rediff.diffs.length === 0) {
                await this.watchlistDb.remove_entity(entity_reference)
                continue
            }
            if (rediff.diffs.length > existing_diffs.length) {
                for (let diff of rediff.diffs) {
                    if (!includesDiff(existing_diffs, diff)) {
                        console.log("ADDED DIff")
                        await this.watchlistDb.add_diff(entity_reference, diff)
                    }
                }
            } else if (existing_diffs.length > rediff.diffs.length) {
                for (let diff of existing_diffs) {
                    if (!includesDiff(rediff.diffs, diff)) {
                        await this.watchlistDb.remove_diff(entity_reference, diff)
                    }
                }
            }
        }
    }

    private async resolve_diffs() {
        let watchlist = await this.watchlistDb.get_watchlist()
        for (const [entity_reference, existing_diffs] of watchlist.entries()) {
            console.log(`Length: ${existing_diffs.length}`)
            console.log(JSON.stringify(existing_diffs))
            await this.start_diff_resolution(entity_reference, existing_diffs)
        }
    }

    private async calculate_batch_size(): Promise<number> {
        return this.batchSize
    }

    private async check_handler_active(diffs: Diff[]): Promise<boolean> {
        const {data: {diff_ids}} = await axios.get(diffs[0].handler_url!)
        return diff_ids.length !== 0
    }

    private async start_diff_resolution(entity_reference: Provider_Entity_Reference, diffs: Diff[]) {
        const rediff: RediffResult | null = await this.rediff(entity_reference)
        if (!rediff) {
            this.logger.warn(`While resolving diffs of entity: ${entity_reference.uuid} rediff result was empty`)
            return
        }
        const {metadata, kind} = rediff
        if (await this.check_handler_active(diffs)) {
            this.logger.info(`Entity :${entity_reference.uuid} has an already running diff, skipping diff handler execution`)
            return
        }
        let next_diff: Diff
        const diff_selection_strategy = this.intentfulContext.getDiffSelectionStrategy(kind!)
        try {
            next_diff = await diff_selection_strategy.selectOne(diffs)
        } catch (e) {
            this.logger.info(`Failed to select diff for entity with uuid: ${metadata!.uuid} and kind: ${metadata!.kind} due to error: ${e}`)
            return
        }
        console.log(`DIFF ID: ${next_diff.id}`)
        const backoff = next_diff.backoff
        console.log(`Backoff: ${backoff}`)
        if (!backoff) {
            this.logger.info(`Starting to resolve diff for entity with uuid: ${metadata!.uuid} and kind: ${metadata!.kind}`)
            this.launch_handler({diff: next_diff, ...rediff}).catch((e) => {
                this.logger.info(`Couldn't invoke intent handler to resolve diff for entity with uuid: ${metadata!.uuid} and kind: ${metadata!.kind} due to error: ${e}`)
            })
        } else {
            // Delay for rediffing
            console.log(`Delay: ${backoff.delay.delay_milliseconds}`)
            if ((new Date().getTime() - backoff.delay.delay_set_time) > backoff.delay.delay_milliseconds) {
                this.logger.info(`Starting to resolve diff for entity with uuid: ${metadata!.uuid} and kind: ${metadata!.kind}`)
                this.launch_handler({diff: next_diff, ...rediff}).catch((e) => {
                    this.logger.info(`Couldn't retry intent handler to resolve diff for entity with uuid: ${metadata!.uuid} and kind: ${metadata!.kind} due to error: ${e}`)
                })
            }
        }
    }

    // This method is needed to avoid race condition
    // when diffs may be added between the check and removing from the watchlist
    // the batch size maybe static or dynamic
    private async add_random_entities() {
        const batch_size = await this.calculate_batch_size()
        const intentful_kind_refs = await this.providerDb.get_intentful_kinds()
        const entities = await this.specDb.list_random_intentful_specs(batch_size, intentful_kind_refs)

        for (let [metadata, spec] of entities) {
            try {
                await this.watchlistDb.add_entity({metadata, spec, status: {}}, [])
            } catch (e) {
                this.logger.debug(`Trying to add entity ${metadata.uuid}, which is already in the watchlist`)
            }
        }
    }
}
