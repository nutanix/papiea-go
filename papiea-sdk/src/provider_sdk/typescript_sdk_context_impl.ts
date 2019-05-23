import { ProceduralCtx_Interface } from "./typescript_sdk_interface";
import { Entity, Metadata, Status, Entity_Reference } from "papiea-core";
import axios from "axios";

export class ProceduralCtx implements ProceduralCtx_Interface {

    base_url: string;
    provider_prefix: string;
    provider_version: string;
    provider_url: string;


    constructor(provider_url:string, entity_url: string, provider_prefix: string, provider_version: string) {
        this.provider_url = provider_url
        this.base_url = entity_url;
        this.provider_prefix = provider_prefix;
        this.provider_version = provider_version;
    }

    url_for(entity: Entity): string {
        return `${this.base_url}/${this.provider_prefix}/${this.provider_version}/${entity.metadata.kind}/${entity.metadata.uuid}`
    }

    async update_status(entity_reference: Entity_Reference, status: Status): Promise<boolean> {
        const res = await axios.patch(`${this.provider_url}/update_status`,{
            entity_ref: entity_reference,
            status: status
        })
        if (res.status != 200) {
            console.error("Could not update status:", entity_reference, status, res.status, res.data)
            return false
        }
        return true
    }

    update_progress(message: string, done_percent: number): boolean {
        throw new Error("Unimplemented")
    }
}