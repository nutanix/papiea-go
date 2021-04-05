import { Entity_Reference, Status, Kind, Differ, Diff, Provider_Entity_Reference, Spec, Metadata } from "papiea-core";
import { Status_DB } from "../../databases/status_db_interface";
import { UserAuthInfo } from "../../auth/authn";
import { Spec_DB } from "../../databases/spec_db_interface";
import { Watchlist_DB } from "../../databases/watchlist_db_interface";
import { create_entry } from "../../intentful_engine/watchlist";
import {RequestContext, spanOperation} from "papiea-backend-utils"
import { PapieaException } from "../../errors/papiea_exception"
import { EntityUpdateResult } from "./intentful_strategy_interface";

export abstract class StatusUpdateStrategy {
    statusDb: Status_DB
    specDb: Spec_DB
    kind?: Kind
    user?: UserAuthInfo

    protected constructor(statusDb: Status_DB, specDb: Spec_DB) {
        this.statusDb = statusDb
        this.specDb = specDb
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<EntityUpdateResult> {
        const [updatedMetadata, updatedStatus] = await this.statusDb.update_status(entity_ref, status);
        const [_, updatedSpec] = await this.specDb.get_spec(entity_ref)
        return {
            intent_watcher: null,
            metadata: updatedMetadata,
            spec: updatedSpec,
            status: updatedStatus
        }
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<EntityUpdateResult> {
        const [updatedMetadata, updatedStatus] = await this.statusDb.replace_status(entity_ref, status);
        const [_, updatedSpec] = await this.specDb.get_spec(entity_ref)
        return {
            intent_watcher: null,
            metadata: updatedMetadata,
            spec: updatedSpec,
            status: updatedStatus
        }
    }

    setKind(kind: Kind) {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }
}

export class SpecOnlyUpdateStrategy extends StatusUpdateStrategy {
    constructor(statusDb: Status_DB, specDb: Spec_DB) {
        super(statusDb, specDb)
    }

    async update(entity_ref: Entity_Reference, status: Status): Promise<EntityUpdateResult> {
        throw new PapieaException(`Cannot update status for spec-only entity`, { kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }})
    }

    async replace(entity_ref: Entity_Reference, status: Status): Promise<EntityUpdateResult> {
        throw new PapieaException(`Cannot replace status for spec-only entity`, { kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }})
    }
}

export class BasicUpdateStrategy extends StatusUpdateStrategy {
    constructor(statusDb: Status_DB, specDb: Spec_DB) {
        super(statusDb, specDb)
    }
}

export class DifferUpdateStrategy extends StatusUpdateStrategy {
    private readonly differ: Differ
    private readonly watchlistDb: Watchlist_DB

    constructor(statusDb: Status_DB, specDb: Spec_DB, differ: Differ, watchlistDb: Watchlist_DB) {
        super(statusDb, specDb)
        this.differ = differ
        this.watchlistDb = watchlistDb
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<EntityUpdateResult> {
        let diffs: Diff[] = []
        const getSpecSpan = spanOperation(`get_spec_db`,
                                   ctx.tracing_ctx)
        const [metadata, spec] = await this.specDb.get_spec(entity_ref)
        getSpecSpan.finish()
        for (let diff of this.differ.diffs(this.kind!, spec, status)) {
            diffs.push(diff)
        }
        const watchlist = await this.watchlistDb.get_watchlist()
        const ent = create_entry(metadata)
        if (!watchlist.has(ent)) {
            watchlist.set([ent, []])
            await this.watchlistDb.update_watchlist(watchlist)
        }
        const span = spanOperation(`update_status_db`,
                                   ctx.tracing_ctx)
        const res = await super.update(entity_ref, status, ctx)
        span.finish()
        return res
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<EntityUpdateResult> {
        const span = spanOperation(`replace_status_db`,
                                   ctx.tracing_ctx)
        const res = await super.replace(entity_ref, status, ctx);
        span.finish()
        return res
    }
}
