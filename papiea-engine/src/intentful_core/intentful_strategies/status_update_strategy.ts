import { Entity_Reference, Status, Kind, Differ, Diff, PapieaEngineTags, Provider_Entity_Reference } from "papiea-core";
import { Status_DB } from "../../databases/status_db_interface";
import { UserAuthInfo } from "../../auth/authn";
import { Spec_DB } from "../../databases/spec_db_interface";
import { Watchlist_DB } from "../../databases/watchlist_db_interface";
import { create_entry } from "../../intentful_engine/watchlist";
import {RequestContext, spanOperation, Logger} from "papiea-backend-utils"
import { PapieaException } from "../../errors/papiea_exception"

export abstract class StatusUpdateStrategy {
    statusDb: Status_DB
    kind?: Kind
    user?: UserAuthInfo
    logger: Logger

    protected constructor(logger: Logger, statusDb: Status_DB) {
        this.statusDb = statusDb
        this.logger = logger
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<any> {
        this.logger.debug(`BEGIN ${this.update.name} in status update strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        await this.statusDb.update_status(entity_ref, status);
        this.logger.debug(`END ${this.update.name} in status update strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<any> {
        this.logger.debug(`BEGIN ${this.replace.name} in status update strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        await this.statusDb.replace_status(entity_ref, status);
        this.logger.debug(`END ${this.replace.name} in status update strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
    }

    setKind(kind: Kind) {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }
}

export class SpecOnlyUpdateStrategy extends StatusUpdateStrategy {
    constructor(logger: Logger, statusDb: Status_DB) {
        super(logger, statusDb)
    }

    async update(entity_ref: Entity_Reference, status: Status): Promise<any> {
        throw new PapieaException(`Cannot update status for spec-only entity`, { kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }})
    }

    async replace(entity_ref: Entity_Reference, status: Status): Promise<any> {
        throw new PapieaException(`Cannot replace status for spec-only entity`, { kind_name: entity_ref.kind, additional_info: { "entity_uuid": entity_ref.uuid }})
    }
}

export class BasicUpdateStrategy extends StatusUpdateStrategy {
    constructor(logger: Logger, statusDb: Status_DB) {
        super(logger, statusDb)
    }
}

export class DifferUpdateStrategy extends StatusUpdateStrategy {
    private readonly differ: Differ
    private readonly watchlistDb: Watchlist_DB
    private readonly specDb: Spec_DB

    constructor(logger: Logger, statusDb: Status_DB, specDb: Spec_DB, differ: Differ, watchlistDb: Watchlist_DB) {
        super(logger, statusDb)
        this.specDb = specDb
        this.differ = differ
        this.watchlistDb = watchlistDb
    }

    async update(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext): Promise<void> {
        this.logger.debug(`BEGIN ${this.update.name} in differ update strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        let diffs: Diff[] = []
        const getSpecSpan = spanOperation(`get_spec_db`,
                                   ctx.tracing_ctx)
        const [metadata, spec] = await this.specDb.get_spec(entity_ref)
        getSpecSpan.finish()
        for (let diff of this.differ.diffs(this.kind!, spec, status, this.logger)) {
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
        await super.update(entity_ref, status, ctx)
        span.finish()
        this.logger.debug(`END ${this.update.name} in differ update strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
    }

    async replace(entity_ref: Provider_Entity_Reference, status: Status, ctx: RequestContext) {
        this.logger.debug(`BEGIN ${this.replace.name} in differ update strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        const span = spanOperation(`replace_status_db`,
                                   ctx.tracing_ctx)
        await this.statusDb.replace_status(entity_ref, status);
        span.finish()
        this.logger.debug(`END ${this.replace.name} in differ update strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
    }
}
