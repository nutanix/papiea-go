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
    private req: Request;
    private res: Response;


    constructor(provider_url:string, entity_url: string, provider_prefix: string, provider_version: string, providerApiAxios:AxiosInstance, securityApi:SecurityApi, req:Request, res:Response) {
        this.provider_url = provider_url
        this.base_url = entity_url;
        this.provider_prefix = provider_prefix;
        this.provider_version = provider_version;
        this.providerApiAxios = providerApiAxios
        this.securityApi = securityApi
        this.req = req
        this.res = res
    }

    url_for(entity: Entity): string {
        return `${this.base_url}/${this.provider_prefix}/${this.provider_version}/${entity.metadata.kind}/${entity.metadata.uuid}`
    }

    // TODO: make functions for all actions
    // TODO: make call to /services/check_permission with body {ref: entity_reference, action: update}



    // TODO: receive headers from request
    async update_status(entity_reference: Entity_Reference, status: Status): Promise<boolean> {
        // TODO: propagate headers to make auth
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
    get_request(): Request {
        return this.req
    }
    get_response(): Response {
        return this.res
    }
}