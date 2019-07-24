import { ProceduralCtx_Interface, SecurityApi } from "./typescript_sdk_interface";
import { Entity, Status, Entity_Reference } from "papiea-core";
import axios, { AxiosInstance } from "axios";
import { Request, Response } from "express";

export class ProceduralCtx implements ProceduralCtx_Interface {
    base_url: string;
    provider_prefix: string;
    provider_version: string;
    provider_url: string;
    private readonly providerApiAxios: AxiosInstance;
    private readonly securityApi: SecurityApi;
    private readonly headers: any;


    constructor(provider_url:string, entity_url: string, provider_prefix: string, provider_version: string, providerApiAxios:AxiosInstance, securityApi:SecurityApi, headers: any) {
        this.provider_url = provider_url
        this.base_url = entity_url;
        this.provider_prefix = provider_prefix;
        this.provider_version = provider_version;
        this.providerApiAxios = providerApiAxios
        this.securityApi = securityApi
        this.headers = headers;
    }

    url_for(entity: Entity): string {
        return `${this.base_url}/${this.provider_prefix}/${this.provider_version}/${entity.metadata.kind}/${entity.metadata.uuid}`
    }

    async check_permission(entity_reference: Entity_Reference, action: Actions): Promise<boolean> {
        try {
            const { data: { success } } = await axios.post(`${ this.base_url }/${ this.provider_prefix }/${ this.provider_version }/check_permission`,
                {
                    entity_ref: entity_reference,
                    action: action
                }, this.headers);
            return success === "Ok";
        } catch (e) {
            return false;
        }
    }


    async update_status(entity_reference: Entity_Reference, status: Status): Promise<boolean> {
        const res = await this.providerApiAxios.patch(`${this.provider_url}/update_status`,{
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

    get_security_api(): SecurityApi {
        return this.securityApi
    }
}

export enum Actions {
    ReadAction = "read",
    UpdateAction = "write",
    CreateAction = "create",
    DeleteAction = "delete",
    RegisterProvider = "register_provider",
    UnregsiterProvider = "unregister_provider",
    ReadProvider = "read_provider",
    UpdateAuth = "update_auth",
    CreateS2SKey = "create_key",
    ReadS2SKey = "read_key",
    InactivateS2SKey = "inactive_key"
}