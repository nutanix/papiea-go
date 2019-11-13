import axios from "axios"
import { Status_DB } from "../databases/status_db_interface";
import { Spec_DB } from "../databases/spec_db_interface";
import { Entity_API, OperationSuccess } from "./entity_api_interface";
import { Validator } from "../validator";
import * as uuid_validate from "uuid-validate";
import { Authorizer } from "../auth/authz";
import { UserAuthInfo } from "../auth/authn";
import {
    Data_Description,
    Entity_Reference,
    Kind,
    Metadata,
    Procedural_Signature,
    Provider,
    Spec,
    Status,
    uuid4,
    Version,
    Action
} from "papiea-core";
import { isEmpty } from "../utils/utils";
import { ValidationError } from "../errors/validation_error";
import { ProcedureInvocationError } from "../errors/procedure_invocation_error";
import uuid = require("uuid");
import { PermissionDeniedError } from "../errors/permission_error";
import { Logger } from "../logger_interface";
import { IntentfulContext } from "../intentful_core/intentful_context"
import { Provider_DB } from "../databases/provider_db_interface"

export type SortParams = { [key: string]: number };

export class Entity_API_Impl implements Entity_API {
    private status_db: Status_DB;
    private spec_db: Spec_DB;
    private authorizer: Authorizer;
    private logger: Logger;
    private validator: Validator
    private readonly intentfulCtx: IntentfulContext
    private providerDb: Provider_DB

    constructor(logger: Logger, status_db: Status_DB, spec_db: Spec_DB, provider_db: Provider_DB, authorizer: Authorizer, validator: Validator, intentfulCtx: IntentfulContext) {
        this.status_db = status_db;
        this.spec_db = spec_db;
        this.providerDb = provider_db;
        this.authorizer = authorizer;
        this.logger = logger;
        this.validator = validator;
        this.intentfulCtx = intentfulCtx
    }

    private async get_provider(prefix: string, version: Version): Promise<Provider> {
        return this.providerDb.get_provider(prefix, version);
    }

    private find_kind(provider: Provider, kind_name: string): Kind {
        const found_kind: Kind | undefined = provider.kinds.find(elem => elem.name === kind_name);
        if (found_kind === undefined) {
            throw new Error(`Kind: ${kind_name} not found`);
        }
        return found_kind;
    }

    async save_entity(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, spec_description: Spec, request_metadata: Metadata = {} as Metadata): Promise<[Metadata, Spec]> {
        const provider = await this.get_provider(prefix, version);
        const kind = this.find_kind(provider, kind_name);
        this.validate_metadata_extension(provider.extension_structure, request_metadata, provider.allowExtraProps);
        this.validate_spec(spec_description, kind, provider.allowExtraProps);
        if (!request_metadata.uuid) {
            request_metadata.uuid = uuid();
        }
        if (!request_metadata.spec_version) {
            request_metadata.spec_version = 0;
        }
        if (!uuid_validate(request_metadata.uuid)) {
            throw new Error("uuid is not valid")
        }
        request_metadata.kind = kind.name;
        await this.authorizer.checkPermission(user, { "metadata": request_metadata }, Action.Create);
        const strategy = this.intentfulCtx.getIntentfulStrategy(kind.intentful_behaviour)
        const [metadata, spec] = await strategy.update(request_metadata, spec_description)
        return [metadata, spec];
    }

    async get_entity_spec(user: UserAuthInfo, kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Spec]> {
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, spec] = await this.spec_db.get_spec(entity_ref);
        await this.authorizer.checkPermission(user, { "metadata": metadata }, Action.Read);
        return [metadata, spec];
    }

    async get_entity_status(user: UserAuthInfo, kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Status]> {
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, status] = await this.status_db.get_status(entity_ref);
        await this.authorizer.checkPermission(user, { "metadata": metadata }, Action.Read);
        return [metadata, status];
    }

    async filter_entity_spec(user: UserAuthInfo, kind_name: string, fields: any, sortParams?: SortParams): Promise<[Metadata, Spec][]> {
        fields.metadata.kind = kind_name;
        const res = await this.spec_db.list_specs(fields, sortParams);
        const filteredRes = await this.authorizer.filter(user, res, Action.Read, x => { return { "metadata": x[0] } });
        return filteredRes;
    }

    async filter_entity_status(user: UserAuthInfo, kind_name: string, fields: any, sortParams?: SortParams): Promise<[Metadata, Status][]> {
        fields.metadata.kind = kind_name;
        const res = await this.status_db.list_status(fields, sortParams);
        const filteredRes = await this.authorizer.filter(user, res, Action.Read, x => { return { "metadata": x[0] } });
        return filteredRes;
    }

    async update_entity_spec(user: UserAuthInfo, uuid: uuid4, prefix: string, spec_version: number, extension: {[key: string]: any}, kind_name: string, version: Version, spec_description: Spec): Promise<[Metadata, Spec]> {
        const provider = await this.get_provider(prefix, version);
        const kind = this.find_kind(provider, kind_name);
        this.validate_spec(spec_description, kind, provider.allowExtraProps);
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: uuid };
        const metadata: Metadata = (await this.spec_db.get_spec(entity_ref))[0];
        await this.authorizer.checkPermission(user, { "metadata": metadata }, Action.Update);
        metadata.spec_version = spec_version;
        metadata.extension = extension;
        const strategy = this.intentfulCtx.getIntentfulStrategy(kind.intentful_behaviour)
        const [res_metadata, spec] = await strategy.update(metadata, spec_description)
        return [res_metadata, spec];
    }

    async delete_entity_spec(user: UserAuthInfo, prefix: string, version: Version, kind_name: string, entity_uuid: uuid4): Promise<void> {
        const provider = await this.get_provider(prefix, version);
        const kind = this.find_kind(provider, kind_name);
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, _] = await this.spec_db.get_spec(entity_ref);
        await this.authorizer.checkPermission(user, { "metadata": metadata }, Action.Delete);
        const strategy = this.intentfulCtx.getIntentfulStrategy(kind.intentful_behaviour)
        await strategy.delete(metadata)
    }

    async call_procedure(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any> {
        const provider = await this.get_provider(prefix, version);
        const kind = this.find_kind(provider, kind_name);
        const entity_spec: [Metadata, Spec] = await this.get_entity_spec(user, kind_name, entity_uuid);
        const entity_status: [Metadata, Status] = await this.get_entity_status(user, kind_name, entity_uuid);
        const procedure: Procedural_Signature | undefined = kind.entity_procedures[procedure_name];
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for kind ${kind.name}`);
        }
        const schemas: any = {};
        Object.assign(schemas, procedure.argument);
        Object.assign(schemas, procedure.result);
        try {
            this.validator.validate(input, Object.values(procedure.argument)[0], schemas, provider.allowExtraProps);
            const { data } = await axios.post(procedure.procedure_callback,
                {
                    metadata: entity_spec[0],
                    spec: entity_spec[1],
                    status: entity_status[1],
                    input: input
                }, {
                    headers: user
                });
            this.validator.validate(data, Object.values(procedure.result)[0], schemas, provider.allowExtraProps);
            return data;
        } catch (err) {
            throw ProcedureInvocationError.fromError(err)
        }
    }

    async call_provider_procedure(user: UserAuthInfo, prefix: string, version: Version, procedure_name: string, input: any): Promise<any> {
        const provider = await this.get_provider(prefix, version);
        if (provider.procedures === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for provider ${prefix}`);
        }
        const procedure: Procedural_Signature | undefined = provider.procedures[procedure_name];
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for provider ${prefix}`);
        }
        const schemas: any = {};
        Object.assign(schemas, procedure.argument);
        Object.assign(schemas, procedure.result);
        try {
            this.validator.validate(input, Object.values(procedure.argument)[0], schemas, provider.allowExtraProps);
            const { data } = await axios.post(procedure.procedure_callback,
                {
                    input: input
                }, {
                    headers: user
                });
            this.validator.validate(data, Object.values(procedure.result)[0], schemas, provider.allowExtraProps);
            return data;
        } catch (err) {
            throw ProcedureInvocationError.fromError(err)
        }
    }

    async call_kind_procedure(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, procedure_name: string, input: any): Promise<any> {
        const provider = await this.get_provider(prefix, version);
        const kind = this.find_kind(provider, kind_name);
        const procedure: Procedural_Signature | undefined = kind.kind_procedures[procedure_name];
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for kind ${kind.name}`);
        }
        const schemas: any = {};
        Object.assign(schemas, procedure.argument);
        Object.assign(schemas, procedure.result);
        try {
            this.validator.validate(input, Object.values(procedure.argument)[0], schemas, provider.allowExtraProps);
            const { data } = await axios.post(procedure.procedure_callback,
                {
                    input: input
                }, {
                    headers: user
                });
            this.validator.validate(data, Object.values(procedure.result)[0], schemas, provider.allowExtraProps);
            return data;
        } catch (err) {
            throw ProcedureInvocationError.fromError(err)
        }
    }

    private validate_spec(spec: Spec, kind: Kind, allowExtraProps: boolean) {
        const schemas: any = Object.assign({}, kind.kind_structure);
        this.validator.validate(spec, Object.values(kind.kind_structure)[0], schemas, allowExtraProps);
    }

    private validate_metadata_extension(extension_structure: Data_Description, metadata: Metadata | undefined, allowExtraProps: boolean) {
        if (metadata === undefined) {
            return
        }
        if (isEmpty(extension_structure)) {
            return
        }
        if (isEmpty(metadata)) {
            throw new ValidationError([{"name": "Error", message: "Metadata extension is not specified"}])
        }
        const schemas: any = Object.assign({}, extension_structure);
        this.validator.validate(metadata.extension, Object.values(extension_structure)[0], schemas, allowExtraProps);
    }

    async check_permission(user: UserAuthInfo, prefix: string, version: Version, entityAction: [Action, Entity_Reference][]): Promise<OperationSuccess> {
        if (entityAction.length === 1) {
            return await this.check_single_permission(user, prefix, version, entityAction[0])
        } else {
            return await this.check_multiple_permissions(user, prefix, version, entityAction)
        }
    }

    async check_single_permission(user: UserAuthInfo, prefix: string, version: Version, entityAction: [Action, Entity_Reference]): Promise<OperationSuccess> {
        const [action, entityRef] = entityAction;
        if (action === Action.Create) {
            const has_perm = await this.has_permission(user, entityRef as Metadata, action)
            if (has_perm) {
                return {"success": "Ok"}
            } else {
                throw new PermissionDeniedError()
            }
        } else {
            const [metadata, _] = await this.spec_db.get_spec(entityRef);
            const has_perm = await this.has_permission(user, metadata, action)
            if (has_perm) {
                return {"success": "Ok"}
            } else {
                throw new PermissionDeniedError()
            }
        }
    }

    async check_multiple_permissions(user: UserAuthInfo, prefix: string, version: Version, entityAction: [Action, Entity_Reference][]): Promise<OperationSuccess> {
        const checkPromises: Promise<boolean>[] = [];
        for (let [action, entityRef] of entityAction) {
            if (action === Action.Create) {
                checkPromises.push(this.has_permission(user, entityRef as Metadata, action));
            } else {
                const [metadata, _] = await this.spec_db.get_spec(entityRef);
                checkPromises.push(this.has_permission(user, metadata, action));
            }
        }
        const has_perm = (await Promise.all(checkPromises)).every((val, index, arr) => val)
        if (has_perm) {
            return { "success": "Ok" }
        } else {
            throw new PermissionDeniedError()
        }
    }

    async has_permission(user: UserAuthInfo, metadata: Metadata, action: Action) {
        try {
            await this.authorizer.checkPermission(user, { "metadata": metadata }, action);
            return true;
        } catch (e) {
            return false;
        }
    }
}