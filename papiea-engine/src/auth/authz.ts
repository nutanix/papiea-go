import { UserAuthInfo, UnauthorizedError } from "./authn";
import { Provider_API } from "../provider/provider_api_interface";
import { Provider } from "papiea-core/build/core";

export class PermissionDeniedError extends Error {
    constructor() {
        super("Permission Denied");
        Object.setPrototypeOf(this, PermissionDeniedError.prototype);
    }
}

export class Action {
    private action: string;

    constructor(action: string) {
        this.action = action;
    }

    getAction(): string {
        return this.action;
    }
}

const ReadAction = new Action('read'),
    UpdateAction = new Action('write'),
    CreateAction = new Action('create'),
    DeleteAction = new Action('delete');

export { ReadAction, UpdateAction, CreateAction, DeleteAction };

export function CallProcedureByNameAction(procedureName: string) {
    return new Action('call' + procedureName);
}

function mapAsync<T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]> {
    return Promise.all(array.map(callbackfn));
}

async function filterAsync<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>): Promise<T[]> {
    const filterMap = await mapAsync(array, callbackfn);
    return array.filter((value, index) => filterMap[index]);
}

export abstract class Authorizer {
    constructor() {
    }

    abstract checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void>;

    async filter(user: UserAuthInfo, objectList: any[], transformfn: (object: any) => any, action: Action): Promise<any[]> {
        return filterAsync(objectList, async (object) => {
            try {
                await this.checkPermission(user, transformfn(object), action);
                return true;
            } catch (e) {
                return false;
            }
        });
    }
}

export class NoAuthAuthorizer extends Authorizer {
    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
    }
}

export interface ProviderAuthorizerFactory {
    createAuthorizer(provider: Provider): Promise<Authorizer>;
}

export class PerProviderAuthorizer extends Authorizer {
    private providerApi: Provider_API;
    private providerToAuthorizer: { [key: string]: Authorizer | null; };
    private kindToProviderPrefix: { [key: string]: string; };
    private providerAuthorizerFactory: ProviderAuthorizerFactory;

    constructor(providerApi: Provider_API, providerAuthorizerFactory: ProviderAuthorizerFactory) {
        super();
        this.providerApi = providerApi;
        providerApi.on_auth_change((provider: Provider) => {
            delete this.providerToAuthorizer[provider.prefix];
        });
        this.providerToAuthorizer = {};
        this.kindToProviderPrefix = {};
        this.providerAuthorizerFactory = providerAuthorizerFactory;
    }

    private async getProviderPrefixByKindName(user: UserAuthInfo, kind_name: string): Promise<string> {
        if (kind_name in this.kindToProviderPrefix) {
            return this.kindToProviderPrefix[kind_name];
        }
        const provider: Provider = await this.providerApi.get_latest_provider_by_kind(user, kind_name);
        if (!provider) {
            throw new PermissionDeniedError();
        }
        this.kindToProviderPrefix[kind_name] = provider.prefix;
        return provider.prefix;
    }

    private async getProviderPrefixByObject(user: UserAuthInfo, object: any): Promise<string> {
        if (object.metadata && object.metadata.kind) {
            return this.getProviderPrefixByKindName(user, object.metadata.kind);
        } else if (object.kind) {
            return this.getProviderPrefixByKindName(user, object.kind.name);
        } else if (object.provider) {
            return object.provider.prefix;
        }
        throw new PermissionDeniedError();
    }

    private async getAuthorizerByObject(user: UserAuthInfo, object: any): Promise<Authorizer | null> {
        const providerPrefix = await this.getProviderPrefixByObject(user, object);
        if (providerPrefix in this.providerToAuthorizer) {
            return this.providerToAuthorizer[providerPrefix];
        }
        const provider: Provider = await this.providerApi.get_latest_provider(user, providerPrefix);
        if (!provider.policy) {
            this.providerToAuthorizer[providerPrefix] = null;
            return null;
        }
        const authorizer = await this.providerAuthorizerFactory.createAuthorizer(provider);
        this.providerToAuthorizer[providerPrefix] = authorizer;
        return authorizer;
    }

    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
        const authorizer: Authorizer | null = await this.getAuthorizerByObject(user, object);
        if (authorizer === null) {
            return;
        }
        if (!user) {
            throw new UnauthorizedError();
        }
        return authorizer.checkPermission(user, object, action);
    }
}