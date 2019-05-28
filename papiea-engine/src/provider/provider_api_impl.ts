import { Provider_API, Provider_Power } from "./provider_api_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Status_DB } from "../databases/status_db_interface";
import { Validator } from "../validator";
import { Authorizer } from "../auth/authz";
import { UserAuthInfo } from "../auth/authn";
import { EventEmitter } from "events";
import { Entity_Reference, Version, Status, Provider } from "papiea-core";
import { Maybe } from "../utils/utils";

export class Provider_API_Impl implements Provider_API {
    providerDb: Provider_DB;
    statusDb: Status_DB;
    private validator: Validator;
    private authorizer: Authorizer;
    private eventEmitter: EventEmitter;

    constructor(providerDb: Provider_DB, statusDb: Status_DB, validator: Validator, authorizer: Authorizer) {
        this.providerDb = providerDb;
        this.statusDb = statusDb;
        this.validator = validator;
        this.authorizer = authorizer;
        this.eventEmitter = new EventEmitter();
    }

    async register_provider(user: UserAuthInfo, provider: Provider): Promise<void> {
        return this.providerDb.save_provider(provider);
    }

    async unregister_provider(user: UserAuthInfo, provider_prefix: string, version: Version): Promise<void> {
        return this.providerDb.delete_provider(provider_prefix, version);
    }

    async replace_status(user: UserAuthInfo, context: any, entity_ref: Entity_Reference, status: Status): Promise<void> {
        const provider: Provider = await this.get_latest_provider_by_kind(user, entity_ref.kind);
        await this.validate_status(provider, entity_ref, status);
        return this.statusDb.replace_status(entity_ref, status);
    }

    async update_status(user: UserAuthInfo, context: any, entity_ref: Entity_Reference, status: Status): Promise<void> {
        return this.statusDb.update_status(entity_ref, status);
    }

    async update_progress(user: UserAuthInfo, context: any, message: string, done_percent: number): Promise<void> {
        // TODO(adolgarev)
        throw new Error("Not implemented");
    }

    async power(user: UserAuthInfo, provider_prefix: string, version: Version, power_state: Provider_Power): Promise<void> {
        // TODO(adolgarev)
        throw new Error("Not implemented");
    }

    async get_provider(user: UserAuthInfo, provider_prefix: string, provider_version: Version): Promise<Provider> {
        return this.providerDb.get_provider(provider_prefix, provider_version);
    }

    async list_providers_by_prefix(user: UserAuthInfo, provider_prefix: string): Promise<Provider[]> {
        return this.providerDb.find_providers(provider_prefix);
    }

    async get_latest_provider(user: UserAuthInfo, provider_prefix: string): Promise<Provider> {
        return this.providerDb.get_latest_provider(provider_prefix);
    }

    async get_latest_provider_by_kind(user: UserAuthInfo, kind_name: string): Promise<Provider> {
        return this.providerDb.get_latest_provider_by_kind(kind_name);
    }

    private async validate_status(provider: Provider, entity_ref: Entity_Reference, status: Status) {
        const kind = provider.kinds.find(kind => kind.name === entity_ref.kind);
        if (kind === undefined) {
            throw new Error("Kind not found");
        }
        const schemas: any = Object.assign({}, kind.kind_structure);
        this.validator.validate(status, Maybe.fromValue(Object.values(kind.kind_structure)[0]), schemas);
    }

    async update_auth(user: UserAuthInfo, provider_prefix: string, provider_version: string, auth: any): Promise<void> {
        const provider: Provider = await this.get_provider(user, provider_prefix, provider_version);
        if (auth.policy !== undefined) {
            provider.policy = auth.policy;
        }
        if (auth.oauth2 !== undefined) {
            provider.oauth2 = auth.oauth2;
        }
        await this.providerDb.save_provider(provider);
        this.eventEmitter.emit('authChange', provider);
    }

    on_auth_change(callbackfn: (provider: Provider) => void): void {
        this.eventEmitter.on('authChange', callbackfn);
    }
}