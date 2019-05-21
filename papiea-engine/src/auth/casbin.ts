import { UserAuthInfo } from "./authn";
import { Authorizer, PermissionDeniedError, Action, ProviderAuthorizerFactory } from "./authz";
import { newEnforcer } from "casbin/lib/casbin";
import { Adapter } from "casbin/lib/persist/adapter";
import { Model } from "casbin/lib/model";
import { Helper } from "casbin/lib/persist/helper";
import { Provider } from "papiea-core/build/core";

export class CasbinAuthorizer extends Authorizer {
    private pathToModel: string;
    private pathToPolicyOrAdaptor: string;
    private enforcer: any;

    constructor(pathToModel: string, pathToPolicyOrAdaptor: any) {
        super();
        this.pathToModel = pathToModel;
        this.pathToPolicyOrAdaptor = pathToPolicyOrAdaptor;
    }

    async init() {
        this.enforcer = await newEnforcer(this.pathToModel, this.pathToPolicyOrAdaptor);
    }

    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
        if (!this.enforcer.enforce(user, object, action.getAction())) {
            throw new PermissionDeniedError();
        }
    }
}

class CasbinMemoryAdapter implements Adapter {
    public readonly policy: string;

    constructor(policy: string) {
        this.policy = policy;
    }

    async loadPolicy(model: Model): Promise<void> {
        if (!this.policy) {
            throw new PermissionDeniedError();
        }
        await this.loadPolicyFile(model, Helper.loadPolicyLine);
    }

    private async loadPolicyFile(model: any, handler: (line: string, model: Model) => void): Promise<void> {
        const lines = this.policy.split('\n');
        lines.forEach((n: string, index: number) => {
            const line = n.trim();
            if (!line) {
                return;
            }
            handler(n, model);
        });
    }

    savePolicy(model: Model): Promise<boolean> {
        throw new Error('not implemented');
    }

    addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
        throw new Error('not implemented');
    }

    removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
        throw new Error('not implemented');
    }

    removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
        throw new Error('not implemented');
    }
}

export class ProviderCasbinAuthorizerFactory implements ProviderAuthorizerFactory {
    private pathToDefaultModel: string;

    constructor(pathToDefaultModel: string) {
        this.pathToDefaultModel = pathToDefaultModel;
    }

    async createAuthorizer(provider: Provider): Promise<Authorizer> {
        if (!provider || !provider.policy) {
            throw new PermissionDeniedError();
        }
        const authorizer = new CasbinAuthorizer(this.pathToDefaultModel, new CasbinMemoryAdapter(provider.policy));
        await authorizer.init();
        return authorizer;
    }
}
