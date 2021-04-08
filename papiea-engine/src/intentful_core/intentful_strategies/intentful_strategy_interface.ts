import { Metadata, Spec, Kind, Entity, IntentWatcher, PapieaEngineTags } from "papiea-core"
import { Spec_DB } from "../../databases/spec_db_interface"
import { Status_DB } from "../../databases/status_db_interface"
import { UserAuthInfo } from "../../auth/authn"
import axios from "axios"
import { OnActionError } from "../../errors/on_action_error";
import { Graveyard_DB } from "../../databases/graveyard_db_interface"
import {
    GraveyardConflictingEntityError
} from "../../databases/utils/errors"
import {RequestContext, spanOperation, Logger} from "papiea-backend-utils"
import {UnauthorizedError} from "../../errors/permission_error"

export abstract class IntentfulStrategy {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    protected readonly graveyardDb: Graveyard_DB
    protected kind?: Kind
    protected user?: UserAuthInfo
    protected logger: Logger

    protected constructor(logger: Logger, specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.graveyardDb = graveyardDb
        this.logger = logger
    }

    protected async check_spec_version(metadata: Metadata, spec_version: number, spec: Spec) {
        this.logger.debug(`BEGIN ${this.check_spec_version.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        const exists = await this.graveyardDb.check_spec_version_exists(metadata, spec_version)
        if (exists) {
            const highest_spec_version = await this.graveyardDb.get_highest_spec_version(metadata)
            metadata.spec_version = spec_version
            throw new GraveyardConflictingEntityError(metadata, spec, highest_spec_version)
        }
        this.logger.debug(`END ${this.check_spec_version.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
    }

    async update_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        this.logger.debug(`BEGIN ${this.update_entity.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        await this.check_spec_version(metadata, metadata.spec_version, spec)
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.update_status(metadata, spec)
        this.logger.debug(`END ${this.update_entity.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        return [updatedMetadata, updatedSpec]
    }

    async delete_entity(entity: Entity): Promise<void> {
        this.logger.debug(`BEGIN ${this.delete_entity.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        await this.graveyardDb.dispose(entity)
        this.logger.debug(`END ${this.delete_entity.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
    }

    async update(metadata: Metadata, spec: Spec, ctx: RequestContext): Promise<IntentWatcher | null> {
        this.logger.debug(`BEGIN ${this.update.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        await this.update_entity(metadata, spec)
        this.logger.debug(`END ${this.update.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        return null
    }

    protected async invoke_destructor(procedure_name: string, entity: Partial<Entity>, ctx: RequestContext): Promise<void> {
        this.logger.debug(`BEGIN ${this.invoke_destructor.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        if (this.kind) {
            if (this.kind.kind_procedures[procedure_name]) {
                if (this.user === undefined) {
                    throw new UnauthorizedError(`No user provided in the delete entity request for kind ${entity.metadata?.provider_prefix}/${entity.metadata?.provider_version}/${entity.metadata?.kind}`, { provider_prefix: entity.metadata?.provider_prefix, provider_version: entity.metadata?.provider_version, kind_name: entity.metadata?.kind, additional_info: { "entity_uuid": entity.metadata?.uuid ?? '', "procedure_name": procedure_name }})
                }
                try {
                    const span = spanOperation(`destructor`,
                                               ctx.tracing_ctx,
                                               {entity_uuid: entity.metadata?.uuid})
                    const { data } =  await axios.post(this.kind.kind_procedures[procedure_name].procedure_callback, {
                        input: entity
                    }, { headers: this.user })
                    span.finish()
                    this.logger.debug(`END ${this.invoke_destructor.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
                    return data
                } catch (e) {
                    throw OnActionError.create(e.response.data.message, procedure_name, { provider_prefix: entity.metadata?.provider_prefix, provider_version: entity.metadata?.provider_version, kind_name: entity.metadata?.kind, additional_info: { "entity_uuid": entity.metadata?.uuid ?? '', "procedure_name": procedure_name }})
                }
            }
        } else {
            throw OnActionError.create(`Could not delete the entity since kind ${entity.metadata?.provider_prefix}/${entity.metadata?.provider_version}/${entity.metadata?.kind} is not registered`, procedure_name, { provider_prefix: entity.metadata?.provider_prefix, provider_version: entity.metadata?.provider_version, kind_name: entity.metadata?.kind, additional_info: { "entity_uuid": entity.metadata?.uuid ?? '', "procedure_name": procedure_name }})
        }
    }

    setKind(kind: Kind): void {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }

    async delete(entity: Entity, ctx: RequestContext): Promise<void> {
        this.logger.debug(`BEGIN ${this.delete.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
        await this.invoke_destructor(`__${entity.metadata.kind}_delete`, { metadata: entity.metadata }, ctx)
        const span = spanOperation(`delete_entity_db`,
                                   ctx.tracing_ctx,
                                   {entity_uuid: entity.metadata.uuid})
        await this.delete_entity(entity)
        span.finish()
        this.logger.debug(`END ${this.delete.name} in intentful strategy`, { tags: [PapieaEngineTags.IntentfulCore] })
    }
}
