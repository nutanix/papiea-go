import { Status, Kind, Differ, Diff, Provider_Entity_Reference } from "papiea-core";
import { Status_DB } from "../../databases/status_db_interface";
import { UserAuthInfo } from "../../auth/authn";
import { Spec_DB } from "../../databases/spec_db_interface";
import { Watchlist_DB } from "../../databases/watchlist_db_interface";
import {RequestContext, spanOperation} from "papiea-backend-utils"
import { PapieaException } from "../../errors/papiea_exception"
import {includesDiff} from "../../utils/utils"
import {WatchlistEntityNotFoundError} from "../../databases/utils/errors"

export abstract class StatusUpdateStrategy {
    statusDb: Status_DB
    kind?: Kind
    user?: UserAuthInfo

    protected constructor(statusDb: Status_DB) {
        this.statusDb = statusDb
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<any> {
        return this.statusDb.update_status(entity_ref, status);
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<any> {
        return this.statusDb.replace_status(entity_ref, status);
    }

    setKind(kind: Kind) {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }
}

export class SpecOnlyUpdateStrategy extends StatusUpdateStrategy {
    constructor(statusDb: Status_DB) {
        super(statusDb)
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status): Promise<any> {
        throw new PapieaException({ message: `Cannot update status for spec-only entity. Verify the entity and entity type.`, entity_info: { provider_prefix: entity_ref.provider_prefix, provider_version: entity_ref.provider_version, kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }}})
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status): Promise<any> {
        throw new PapieaException({ message: `Cannot replace status for spec-only entity. Verify the entity and entity type.`, entity_info: { provider_prefix: entity_ref.provider_prefix, provider_version: entity_ref.provider_version, kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }}})
    }
}

export class BasicUpdateStrategy extends StatusUpdateStrategy {
    constructor(statusDb: Status_DB) {
        super(statusDb)
    }
}

export class DifferUpdateStrategy extends StatusUpdateStrategy {
    private readonly differ: Differ
    private readonly watchlistDb: Watchlist_DB
    private readonly specDb: Spec_DB

    constructor(statusDb: Status_DB, specDb: Spec_DB, differ: Differ, watchlistDb: Watchlist_DB) {
        super(statusDb)
        this.specDb = specDb
        this.differ = differ
        this.watchlistDb = watchlistDb
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<void> {
        const getSpecSpan = spanOperation(`get_spec_db`,
                                   ctx.tracing_ctx)
        const [metadata, spec] = await this.specDb.get_spec(entity_ref)
        getSpecSpan.finish()
        const diffs = this.differ.all_diffs(entity_ref, this.kind!, spec, status)
        const span = spanOperation(`update_status_db`,
            ctx.tracing_ctx)
        await super.update(entity_ref, status, ctx)
        span.finish()
        try {
            const entity_diffs = await this.watchlistDb.get_entity_diffs(metadata)
            const pending_diffs = []
            for (let diff of diffs) {
                if (!includesDiff(entity_diffs, diff)) {
                    pending_diffs.push(diff)
                }
            }
            await this.watchlistDb.add_diffs(metadata, pending_diffs)
        } catch (e) {
            if (e instanceof WatchlistEntityNotFoundError) {
                await this.watchlistDb.add_entity({metadata, spec, status}, diffs)
            }
        }
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext) {
        const span = spanOperation(`replace_status_db`,
                                   ctx.tracing_ctx)
        await this.statusDb.replace_status(entity_ref, status);
        span.finish()
    }
}
