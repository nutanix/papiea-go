import { Spec_DB } from "../../databases/spec_db_interface"
import { Status_DB } from "../../databases/status_db_interface"
import { IntentfulStrategy } from "./intentful_strategy_interface"
import { Metadata, Spec, PapieaEngineTags, IntentWatcher } from "papiea-core"
import { Graveyard_DB } from "../../databases/graveyard_db_interface"
import {RequestContext, spanOperation, Logger} from "papiea-backend-utils"

export class SpecOnlyIntentfulStrategy extends IntentfulStrategy {
    constructor(logger: Logger, specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB) {
        super(logger, specDb, statusDb, graveyardDb)
    }

    // Replace spec and status with spec changes received
    async update_entity(metadata: Metadata, spec: Spec): Promise<Spec> {
        this.logger.debug(`BEGIN ${this.update_entity.name} in spec-only intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.replace_status(metadata, spec)
        this.logger.debug(`END ${this.update_entity.name} in spec-only intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        return [updatedMetadata, updatedSpec]
    }

    // Update spec and status with spec changes received
    async update(metadata: Metadata, spec: Spec, ctx: RequestContext): Promise<IntentWatcher | null> {
        this.logger.debug(`BEGIN ${this.update.name} in spec-only intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        const span = spanOperation(`update_entity_db`,
                                   ctx.tracing_ctx,
                                   {entity_uuid: metadata.uuid})
        await this.update_entity(metadata, spec)
        span.finish()
        this.logger.debug(`END ${this.update.name} in spec-only intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        return null
    }
}
