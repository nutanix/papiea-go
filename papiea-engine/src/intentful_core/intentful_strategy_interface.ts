import { Metadata, Spec, Kind, Entity } from "papiea-core"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { UserAuthInfo } from "../auth/authn"
import axios from "axios"
import { IntentfulTask } from "../tasks/task_interface"
import { OnActionError } from "../errors/on_action_error";

export abstract class IntentfulStrategy {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    protected kind?: Kind
    protected user?: UserAuthInfo

    protected constructor(specDb: Spec_DB, statusDb: Status_DB) {
        this.specDb = specDb
        this.statusDb = statusDb
    }

    async update_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.update_status(metadata, spec)
        return [updatedMetadata, updatedSpec]
    }

    async create_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.replace_status(metadata, spec)
        return [updatedMetadata, updatedSpec]
    }

    async delete_entity(metadata: Metadata): Promise<void> {
        await this.specDb.delete_spec(metadata);
        await this.statusDb.delete_status(metadata);
    }

    async update(metadata: Metadata, spec: Spec): Promise<IntentfulTask | null> {
        await this.update_entity(metadata, spec)
        return null
    }

    async create(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        await this.dispatch("__create", { metadata, spec })
        return this.create_entity(metadata, spec)
    }

    protected async dispatch(procedure_name: string, entity: Partial<Entity>): Promise<any> {
        if (this.kind) {
            if (this.kind.kind_procedures[procedure_name]) {
                if (this.user === undefined) {
                    throw new OnActionError("User not specified", procedure_name)
                }
                try {
                    const { data } =  await axios.post(this.kind.kind_procedures[procedure_name].procedure_callback, {
                        input: entity
                    }, { headers: this.user })
                    return data
                } catch (e) {
                    throw new OnActionError(e.response.data.message, procedure_name)
                }
            }
        } else {
            throw new OnActionError("Insufficient params specified", procedure_name)
        }
    }

    setKind(kind: Kind): void {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }

    async delete(metadata: Metadata): Promise<void> {
        await this.dispatch("__delete", { metadata })
        return this.delete_entity(metadata)
    }
}