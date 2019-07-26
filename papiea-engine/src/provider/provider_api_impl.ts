import { Provider_API, Provider_Power } from "./provider_api_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Status_DB } from "../databases/status_db_interface";
import { S2S_Key_DB } from "../databases/s2skey_db_interface";
import { Validator } from "../validator";
import { Authorizer } from "../auth/authz";
import { UserAuthInfo } from "../auth/authn";
import { createHash } from "../auth/crypto";
import { EventEmitter } from "events";
import { Entity_Reference, Key, Kind, Provider, S2S_Key, Status, Version, Action } from "papiea-core";
import { Maybe } from "../utils/utils";

export class Provider_API_Impl implements Provider_API {
    private providerDb: Provider_DB;
    private statusDb: Status_DB;
    private s2skeyDb: S2S_Key_DB;
    private validator: Validator;
    private authorizer: Authorizer;
    private eventEmitter: EventEmitter;

    constructor(providerDb: Provider_DB, statusDb: Status_DB, s2skeyDb: S2S_Key_DB, validator: Validator, authorizer: Authorizer) {
        this.providerDb = providerDb;
        this.statusDb = statusDb;
        this.s2skeyDb = s2skeyDb;
        this.validator = validator;
        this.authorizer = authorizer;
        this.eventEmitter = new EventEmitter();
    }

    async register_provider(user: UserAuthInfo, provider: Provider): Promise<void> {
        await this.authorizer.checkPermission(user, provider, Action.RegisterProvider);
        return this.providerDb.save_provider(provider);
    }

    async unregister_provider(user: UserAuthInfo, provider_prefix: string, version: Version): Promise<void> {
        await this.authorizer.checkPermission(user, { prefix: provider_prefix }, Action.UnregisterProvider);
        return this.providerDb.delete_provider(provider_prefix, version);
    }

    async replace_status(user: UserAuthInfo, context: any, entity_ref: Entity_Reference, status: Status): Promise<void> {
        const provider: Provider = await this.get_latest_provider_by_kind(user, entity_ref.kind);
        await this.authorizer.checkPermission(user, provider, Action.UpdateStatus);
        await this.validate_status(provider, entity_ref, status);
        return this.statusDb.replace_status(entity_ref, status);
    }

    async update_status(user: UserAuthInfo, context: any, entity_ref: Entity_Reference, status: Status): Promise<void> {
        const provider: Provider = await this.get_latest_provider_by_kind(user, entity_ref.kind);
        await this.authorizer.checkPermission(user, provider, Action.UpdateStatus);
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
        await this.authorizer.checkPermission(user, { prefix: provider_prefix }, Action.ReadProvider);
        return this.providerDb.get_provider(provider_prefix, provider_version);
    }

    async list_providers_by_prefix(user: UserAuthInfo, provider_prefix: string): Promise<Provider[]> {
        const res = await this.providerDb.find_providers(provider_prefix);
        return this.authorizer.filter(user, res, Action.ReadProvider);
    }

    async get_latest_provider(user: UserAuthInfo, provider_prefix: string): Promise<Provider> {
        await this.authorizer.checkPermission(user, { prefix: provider_prefix }, Action.ReadProvider);
        return this.providerDb.get_latest_provider(provider_prefix);
    }

    async get_latest_provider_by_kind(user: UserAuthInfo, kind_name: string): Promise<Provider> {
        const res = await this.providerDb.get_latest_provider_by_kind(kind_name);
        await this.authorizer.checkPermission(user, res, Action.ReadProvider);
        return res;
    }

    private async validate_status(provider: Provider, entity_ref: Entity_Reference, status: Status) {
        const kind = provider.kinds.find((kind: Kind) => kind.name === entity_ref.kind);
        if (kind === undefined) {
            throw new Error("Kind not found");
        }
        const schemas: any = Object.assign({}, kind.kind_structure);
        this.validator.validate(status, Maybe.fromValue(Object.values(kind.kind_structure)[0]), schemas);
    }

    async update_auth(user: UserAuthInfo, provider_prefix: string, provider_version: Version, auth: any): Promise<void> {
        const provider: Provider = await this.get_provider(user, provider_prefix, provider_version);
        await this.authorizer.checkPermission(user, provider, Action.UpdateAuth);
        if (auth.authModel !== undefined) {
            provider.authModel = auth.authModel;
        }
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

    async create_key(user: UserAuthInfo, name: string, owner: string, provider_prefix: string, extension?: any, key?: string): Promise<S2S_Key> {
        // - name is not mandatory, displayed in UI
        // - owner is the owner of the key (usually email),
        // it is not unique, different providers may have same owner
        // - provider_prefix determines provider key belongs to,
        // tuple (owner, provider_prefix) determines a set of keys owner owns for given provider
        // - extension is a UserAuthInfo which will be used when s2s key provided, that is 
        // if s2skey A is provided in Authoriation
        // then casbin will do all checks against A.extension.owner,
        // A.extension.provider_prefix, A.extension.tenant, etc.
        // In other words user with s2skey A talks on behalf of user in A.extension
        // All rules who can talk on behalf of whom are defined in AdminAuthorizer
        const s2skey: S2S_Key = {
            name: name,
            owner: owner,
            provider_prefix: provider_prefix,
            key: "",
            created_at: new Date(),
            deleted_at: undefined,
            extension: extension ? extension : user
        };
        s2skey.key = key ? key : createHash(s2skey);
        await this.authorizer.checkPermission(user, s2skey, Action.CreateS2SKey);
        await this.s2skeyDb.create_key(s2skey);
        return this.s2skeyDb.get_key(s2skey.key);
    }

    async get_key(user: UserAuthInfo, key: Key): Promise<S2S_Key> {
        const s2skey = await this.s2skeyDb.get_key(key);
        await this.authorizer.checkPermission(user, s2skey, Action.ReadS2SKey);
        return s2skey;
    }

    async list_keys(user: UserAuthInfo, fields_map: any): Promise<S2S_Key[]> {
        const res = await this.s2skeyDb.list_keys(fields_map);
        return this.authorizer.filter(user, res, Action.ReadS2SKey);
    }

    async inactivate_key(user: UserAuthInfo, key: Key): Promise<void> {
        const s2skey = await this.s2skeyDb.get_key(key);
        await this.authorizer.checkPermission(user, s2skey, Action.InactivateS2SKey);
        await this.s2skeyDb.inactivate_key(key);
    }
}