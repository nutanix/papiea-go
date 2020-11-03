import { Provider_API, Provider_Power } from "./provider_api_interface";
import { Provider_DB } from "../databases/provider_db_interface";
import { Status_DB } from "../databases/status_db_interface";
import { S2S_Key_DB } from "../databases/s2skey_db_interface";
import { Validator } from "../validator";
import { Authorizer } from "../auth/authz";
import { UserAuthInfo } from "../auth/authn";
import { createHash } from "../auth/crypto";
import { EventEmitter } from "events";
import { Action, Entity_Reference, Kind, Provider, S2S_Key, Secret, Status, Version } from "papiea-core";
import { Logger } from "papiea-backend-utils";
import { Watchlist_DB } from "../databases/watchlist_db_interface";
import { SpecOnlyUpdateStrategy } from "../intentful_core/intentful_strategies/status_update_strategy";
import { IntentfulContext } from "../intentful_core/intentful_context";
import uuid = require("uuid");
import { isEmpty } from "lodash";

export class Provider_API_Impl implements Provider_API {
    private providerDb: Provider_DB;
    private statusDb: Status_DB;
    private s2skeyDb: S2S_Key_DB;
    private authorizer: Authorizer;
    private eventEmitter: EventEmitter;
    private logger: Logger;
    private validator: Validator
    private watchlistDb: Watchlist_DB;
    private intentfulContext: IntentfulContext;

    constructor(logger: Logger, providerDb: Provider_DB, statusDb: Status_DB,
                s2skeyDb: S2S_Key_DB, watchlistDb: Watchlist_DB,
                intentfulContext: IntentfulContext, authorizer: Authorizer,
                validator: Validator)
    {
        this.providerDb = providerDb;
        this.statusDb = statusDb;
        this.s2skeyDb = s2skeyDb;
        this.watchlistDb = watchlistDb
        this.intentfulContext = intentfulContext
        this.authorizer = authorizer;
        this.eventEmitter = new EventEmitter();
        this.logger = logger;
        this.validator = validator
    }

    async register_provider(user: UserAuthInfo, provider: Provider): Promise<void> {
        await this.authorizer.checkPermission(user, provider, Action.RegisterProvider);
        this.validator.validate_provider(provider)
        this.validator.validate_sfs(provider)
        return this.providerDb.save_provider(provider);
    }

    async list_providers(user: UserAuthInfo): Promise<Provider[]> {
        const providers = await this.providerDb.list_providers();
        return this.authorizer.filter(user, providers, Action.ReadProvider);
    };

    async unregister_provider(user: UserAuthInfo, provider_prefix: string, version: Version): Promise<void> {
        await this.authorizer.checkPermission(user, { prefix: provider_prefix }, Action.UnregisterProvider);
        return this.providerDb.delete_provider(provider_prefix, version);
    }

    async replace_status(user: UserAuthInfo, provider_prefix: string, version: Version, context: any, entity_ref: Entity_Reference, status: Status): Promise<void> {
        const provider: Provider = await this.providerDb.get_provider(provider_prefix, version);
        const kind = this.providerDb.find_kind(provider, entity_ref.kind)
        const strategy = this.intentfulContext.getStatusUpdateStrategy(kind, user)
        // if this is not critical, we can swap the order of checkPermission() and update()
        // to remove the verbose check
        if (strategy instanceof SpecOnlyUpdateStrategy) {
            throw new Error("Cannot change status of a spec-only kind")
        }
        await this.authorizer.checkPermission(user, provider, Action.UpdateStatus);
        await this.validator.validate_status(provider, entity_ref, status);
        return strategy.replace({provider_prefix: provider_prefix, provider_version: version, ...entity_ref}, status)
    }

    async update_status(user: UserAuthInfo, provider_prefix: string, version: Version, context: any, entity_ref: Entity_Reference, partialStatus: Status): Promise<void> {
        const provider: Provider = await this.providerDb.get_provider(provider_prefix, version);
        const kind = this.providerDb.find_kind(provider, entity_ref.kind)
        const strategy = this.intentfulContext.getStatusUpdateStrategy(kind, user)
        // if this is not critical, we can swap the order of checkPermission() and update()
        // to remove the verbose check
        if (strategy instanceof SpecOnlyUpdateStrategy) {
            throw new Error("Cannot change status of a spec-only kind")
        }
        await this.authorizer.checkPermission(user, provider, Action.UpdateStatus);
        // We receive update in form of partial status
        // e.g. full status: {name: {last: 'Foo', first: 'Bar'}}
        // e.g. partial status update: {name: {last: 'BBB'}}
        // Thus we get the merged version and validate it
        // Only after that we transform partial status into mongo dot notation query
        const [,currentStatus] = await this.statusDb.get_status({provider_prefix: provider_prefix, provider_version: version, ...entity_ref})
        let mergedStatus: any
        // Replace status if dealing with arrays
        if (Array.isArray(currentStatus) && Array.isArray(partialStatus)) {
            this.logger.debug("Trying to update status as array, using replace semantics!")
            mergedStatus = partialStatus
        } else {
            mergedStatus = {...currentStatus, ...partialStatus}
        }
        await this.validator.validate_status(provider, entity_ref, mergedStatus);

        const schemas: any = Object.assign({}, kind.kind_structure);
        partialStatus = await this.fix_null_object(schemas[kind.name], partialStatus);
        return strategy.update({provider_prefix: provider_prefix, provider_version: version, ...entity_ref}, partialStatus)
    }

    async update_progress(user: UserAuthInfo, context: any, message: string, done_percent: number): Promise<void> {
        // TODO(adolgarev)
        throw new Error("Not implemented");
    }

    async power(user: UserAuthInfo, provider_prefix: string, version: Version, power_state: Provider_Power): Promise<void> {
        // TODO(adolgarev)
        throw new Error("Not implemented");
    }

    private async get_provider_unchecked(provider_prefix: string, provider_version: Version): Promise<Provider> {
        return this.providerDb.get_provider(provider_prefix, provider_version);
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
        return this.providerDb.get_latest_provider(provider_prefix);
    }

    async get_latest_provider_by_kind(user: UserAuthInfo, kind_name: string): Promise<Provider> {
        return await this.providerDb.get_latest_provider_by_kind(kind_name);
    }

    async fix_null_object(schemas: any, status: Status): Promise<Status> {
        if (schemas.type === 'object' && (status === null || status === undefined || Object.keys(status).length === 0)) {
            status = {}
        } else if (schemas.type === 'object') {
            const properties_schema = schemas.properties;
            for (var key in status) {
                status[key] = await this.fix_null_object(properties_schema[key], status[key])
            }
        }
        return status
    }

    async update_auth(user: UserAuthInfo, provider_prefix: string, provider_version: Version, auth: any): Promise<void> {
        const provider: Provider = await this.get_provider_unchecked(provider_prefix, provider_version);
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

    async create_key(user: UserAuthInfo, name: string, owner: string, provider_prefix: string, user_info?: any, key?: Secret): Promise<S2S_Key> {
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
            uuid: uuid(),
            owner: owner,
            provider_prefix: provider_prefix,
            key: "",
            created_at: new Date(),
            deleted_at: undefined,
            user_info: Object.assign({}, user_info ? user_info : user)
        };
        s2skey.key = key ? key : createHash(s2skey);
        await this.authorizer.checkPermission(user, s2skey, Action.CreateS2SKey);
        await this.s2skeyDb.create_key(s2skey);
        return this.s2skeyDb.get_key(s2skey.uuid);
    }

    async get_key(user: UserAuthInfo, uuid: string): Promise<S2S_Key> {
        const s2skey = await this.s2skeyDb.get_key(uuid);
        await this.authorizer.checkPermission(user, s2skey, Action.ReadS2SKey);
        return s2skey;
    }

    async inactivate_key(user: UserAuthInfo, uuid: string): Promise<void> {
        const s2skey: S2S_Key = await this.s2skeyDb.get_key(uuid);
        await this.authorizer.checkPermission(user, s2skey, Action.InactivateS2SKey);
        await this.s2skeyDb.inactivate_key(s2skey.uuid);
    }

    async filter_keys(user: UserAuthInfo, fields: any): Promise<S2S_Key[]> {
        const res = await this.s2skeyDb.list_keys(fields);
        let secret;
        for (let s2s_key of res) {
            secret = s2s_key.key;
            s2s_key.key = secret.slice(0, 2) + "*****" + secret.slice(-2);
        }
        return this.authorizer.filter(user, res, Action.ReadS2SKey);
    }
}
