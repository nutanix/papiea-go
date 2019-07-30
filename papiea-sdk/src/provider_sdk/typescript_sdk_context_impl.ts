import { ProceduralCtx_Interface, SecurityApi } from "./typescript_sdk_interface";
import { Entity, Status, Entity_Reference, Action } from "papiea-core";
import { AxiosInstance } from "axios";
import { ProviderSdk } from "./typescript_sdk";
import { IncomingHttpHeaders } from "http";

export class ProceduralCtx implements ProceduralCtx_Interface {
    base_url: string;
    provider_prefix: string;
    provider_version: string;
    provider_url: string;
    private readonly providerApiAxios: AxiosInstance;
    provider: ProviderSdk;
    headers: IncomingHttpHeaders;

    constructor(provider:ProviderSdk, provider_prefix: string, provider_version: string, headers: IncomingHttpHeaders) {

        this.provider_url = provider.provider_url;
        this.base_url = provider.entity_url;
        this.provider_prefix = provider_prefix;
        this.provider_version = provider_version;
        this.providerApiAxios = provider.provider_api_axios;
        this.provider = provider;
        this.headers = headers
    }

    url_for(entity: Entity): string {
        return `${this.base_url}/${this.provider_prefix}/${this.provider_version}/${entity.metadata.kind}/${entity.metadata.uuid}`
    }

    async check_permission(entityAction: [Action, Entity_Reference][], provider_prefix: string = this.provider_prefix, provider_version: Version = this.provider_version): Promise<boolean> {
        return this.try_check(provider_prefix, provider_version, entityAction)
    }

    async try_check(provider_prefix: string, provider_version: Version, entityAction: [Action, Entity_Reference][]) {
        try {
            const { data: { success } } = await axios.post(`${ this.base_url }/${ provider_prefix }/${ provider_version }/check_permission`,
                entityAction, { headers: this.headers });
            return success === "Ok";
        } catch (e) {
            return false;
        }
    }


    async update_status(entity_reference: Entity_Reference, status: Status): Promise<boolean> {
        const res = await this.providerApiAxios.patch(`${this.provider_url}/update_status`,{
            entity_ref: entity_reference,
            status: status
        });
        if (res.status != 200) {
            console.error("Could not update status:", entity_reference, status, res.status, res.data);
            return false
        }
        return true
    }

    update_progress(message: string, done_percent: number): boolean {
        throw new Error("Unimplemented")
    }

    get_provider_security_api(): SecurityApi {
        return this.provider.providerSecurityApi
    }
    get_user_security_api(user_s2skey: string): SecurityApi {
        return this.provider.new_security_api(user_s2skey)
    }
    get_headers(): IncomingHttpHeaders {
        return this.headers
    }
    get_invoking_token(): string {
        if (this.headers.authorization) {
            const parts = this.headers.authorization.split(' ');
            if (parts[0] === 'Bearer')
                return parts[1]
        }
        throw new Error("No invoking user")
    }
}