import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { IntentfulStrategy } from "./intentful_strategy_interface"
import { Metadata, Spec } from "papiea-core"

export class BasicIntentfulStrategy implements IntentfulStrategy {
    private readonly specDb: Spec_DB
    private readonly statusDb: Status_DB

    constructor(specDb: Spec_DB, statusDb: Status_DB) {
        this.specDb = specDb
        this.statusDb = statusDb
    }

    // Update spec and status with spec changes received
    async update(metadata: Metadata, spec: Spec): Promise<Spec> {
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        const [_, existingStatus] = await this.statusDb.get_status(metadata)
        if (existingStatus) {
            await this.statusDb.update_status(metadata, spec)
        } else {
            await this.statusDb.replace_status(metadata, spec)
        }
        return [updatedMetadata, updatedSpec]
    }

    // Simply delete from DB both spec and status
    async delete(metadata: Metadata): Promise<void> {
        await this.specDb.delete_spec(metadata);
        await this.statusDb.delete_status(metadata);
    }
}