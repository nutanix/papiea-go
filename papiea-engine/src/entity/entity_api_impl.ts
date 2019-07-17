import axios from "axios"
import { Status_DB } from "../databases/status_db_interface";
import { Spec_DB } from "../databases/spec_db_interface";
import { Entity_API } from "./entity_api_interface";
import { ValidationError, Validator } from "../validator";
import * as uuid_validate from "uuid-validate";
import { Authorizer, ReadAction, CreateAction, DeleteAction, UpdateAction, CallProcedureByNameAction } from "../auth/authz";
import { UserAuthInfo } from "../auth/authn";
import { Provider_API } from "../provider/provider_api_interface";
import uuid = require("uuid");
import { Version, Spec, Metadata, uuid4, Entity_Reference, Status, Data_Description, Provider, Kind, Procedural_Signature } from "papiea-core";
import { isEmpty, Maybe } from "../utils/utils";

export class ProcedureInvocationError extends Error {
    errors: string[];
    status: number;

    constructor(errors: string[], status: number) {
        super(JSON.stringify(errors));
        Object.setPrototypeOf(this, ProcedureInvocationError.prototype);
        this.errors = errors;
        this.status = status;
    }
}

export class Entity_API_Impl implements Entity_API {
    private status_db: Status_DB;
    private spec_db: Spec_DB;
    private provider_api: Provider_API;
    private validator: Validator;
    private authorizer: Authorizer;

    constructor(status_db: Status_DB, spec_db: Spec_DB, provider_api: Provider_API, validator: Validator, authorizer: Authorizer) {
        this.status_db = status_db;
        this.spec_db = spec_db;
        this.provider_api = provider_api;
        this.validator = validator;
        this.authorizer = authorizer;
    }

    private async get_kind(user: UserAuthInfo, prefix: string, kind_name: string, version: Version): Promise<Kind> {
        const provider = await this.provider_api.get_provider(user, prefix, version);
        return this.find_kind(provider, kind_name);
    }

    private find_kind(provider: Provider, kind_name: string): Kind {
        const found_kind: Kind | undefined = provider.kinds.find(elem => elem.name === kind_name);
        if (found_kind === undefined) {
            throw new Error(`Kind: ${kind_name} not found`);
        }
        return found_kind;
    }

    async save_entity(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, spec_description: Spec, request_metadata: Metadata = {} as Metadata): Promise<[Metadata, Spec]> {
        const provider = await this.provider_api.get_provider(user, prefix, version);
        const kind = this.find_kind(provider, kind_name);
        this.validate_metadata_extension(provider.extension_structure, request_metadata);
        this.validate_spec(spec_description, kind);
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
        await this.authorizer.checkPermission(user, { "metadata": request_metadata }, CreateAction);
        const [metadata, spec] = await this.spec_db.update_spec(request_metadata, spec_description);
        if (kind.kind_structure[kind.name]['x-papiea-entity'] === 'spec-only')
            await this.status_db.replace_status(request_metadata, spec_description);
        return [metadata, spec];
    }

    async get_entity_spec(user: UserAuthInfo, kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Spec]> {
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, spec] = await this.spec_db.get_spec(entity_ref);
        await this.authorizer.checkPermission(user, { "metadata": metadata }, ReadAction);
        return [metadata, spec];
    }

    async get_entity_status(user: UserAuthInfo, kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Status]> {
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, status] = await this.status_db.get_status(entity_ref);
        await this.authorizer.checkPermission(user, { "metadata": metadata }, ReadAction);
        return [metadata, status];
    }

    async filter_entity_spec(user: UserAuthInfo, kind_name: string, fields: any): Promise<[Metadata, Spec][]> {
        fields.metadata.kind = kind_name;
        const res = await this.spec_db.list_specs(fields);
        const filteredRes = await this.authorizer.filter(user, res, ReadAction, x => { return { "metadata": x[0] } });
        return filteredRes;
    }

    async filter_entity_status(user: UserAuthInfo, kind_name: string, fields: any): Promise<[Metadata, Status][]> {
        fields.metadata.kind = kind_name;
        const res = await this.status_db.list_status(fields);
        const filteredRes = await this.authorizer.filter(user, res, ReadAction, x => { return { "metadata": x[0] } });
        return filteredRes;
    }

    async update_entity_spec(user: UserAuthInfo, uuid: uuid4, prefix: string, spec_version: number, extension: {[key: string]: any}, kind_name: string, version: Version, spec_description: Spec): Promise<[Metadata, Spec]> {
        const kind: Kind = await this.get_kind(user, prefix, kind_name, version);
        this.validate_spec(spec_description, kind);
        const metadata: Metadata = { uuid: uuid, kind: kind.name, spec_version: spec_version, extension: extension } as Metadata;
        await this.authorizer.checkPermission(user, { "metadata": metadata }, UpdateAction);
        const [_, spec] = await this.spec_db.update_spec(metadata, spec_description);
        if (kind.kind_structure[kind.name]['x-papiea-entity'] === 'spec-only')
            await this.status_db.replace_status(metadata, spec_description);
        return [metadata, spec];
    }

    async delete_entity_spec(user: UserAuthInfo, kind_name: string, entity_uuid: uuid4): Promise<void> {
        const entity_ref: Entity_Reference = { kind: kind_name, uuid: entity_uuid };
        const [metadata, _] = await this.spec_db.get_spec(entity_ref);
        await this.authorizer.checkPermission(user, { "metadata": metadata }, DeleteAction);
        await this.spec_db.delete_spec(entity_ref);
        await this.status_db.delete_status(entity_ref);
    }

    async call_procedure(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any> {
        const kind: Kind = await this.get_kind(user, prefix, kind_name, version);
        const entity_spec: [Metadata, Spec] = await this.get_entity_spec(user, kind_name, entity_uuid);
        const entity_status: [Metadata, Status] = await this.get_entity_status(user, kind_name, entity_uuid);
        await this.authorizer.checkPermission(user, { "metadata": entity_spec[0] }, CallProcedureByNameAction(procedure_name));
        const procedure: Procedural_Signature | undefined = kind.entity_procedures[procedure_name];
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for kind ${kind.name}`);
        }
        const schemas: any = {};
        Object.assign(schemas, procedure.argument);
        Object.assign(schemas, procedure.result);
        try {
            this.validator.validate(input, Maybe.fromValue(Object.values(procedure.argument)[0]), schemas);
            const { data } = await axios.post(procedure.procedure_callback,
                {
                    metadata: entity_spec[0],
                    spec: entity_spec[1],
                    status: entity_status[1],
                    input: input
                }, {
                    headers: user
                });
            this.validator.validate(data, Maybe.fromValue(Object.values(procedure.result)[0]), schemas);
            return data;
        } catch (err) {
            if (err instanceof ValidationError) {
                throw new ProcedureInvocationError(err.errors, 400);
            } else if (err.response) {
                throw new ProcedureInvocationError([err.response.data], err.response.status)
            } else {
                throw err;
            }
        }
    }

    async call_provider_procedure(user: UserAuthInfo, prefix: string, version: Version, procedure_name: string, input: any): Promise<any> {
        const provider = await this.provider_api.get_provider(user, prefix, version);
        await this.authorizer.checkPermission(user, { provider: provider }, CallProcedureByNameAction(procedure_name));
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
            this.validator.validate(input, Maybe.fromValue(Object.values(procedure.argument)[0]), schemas);
            const { data } = await axios.post(procedure.procedure_callback,
                {
                    input: input
                }, {
                    headers: user
                });
            this.validator.validate(data, Maybe.fromValue(Object.values(procedure.result)[0]), schemas);
            return data;
        } catch (err) {
            if (err instanceof ValidationError) {
                throw new ProcedureInvocationError(err.errors, 400);
            } else {
                throw new ProcedureInvocationError([err.response.data], err.response.status)
            }
        }
    }

    async call_kind_procedure(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, procedure_name: string, input: any): Promise<any> {
        const kind: Kind = await this.get_kind(user, prefix, kind_name, version);
        await this.authorizer.checkPermission(user, { kind: kind }, CallProcedureByNameAction(procedure_name));
        const procedure: Procedural_Signature | undefined = kind.kind_procedures[procedure_name];
        if (procedure === undefined) {
            throw new Error(`Procedure ${procedure_name} not found for kind ${kind.name}`);
        }
        const schemas: any = {};
        Object.assign(schemas, procedure.argument);
        Object.assign(schemas, procedure.result);
        try {
            this.validator.validate(input, Maybe.fromValue(Object.values(procedure.argument)[0]), schemas);
            const { data } = await axios.post(procedure.procedure_callback,
                {
                    input: input
                }, {
                    headers: user
                });
            this.validator.validate(data, Maybe.fromValue(Object.values(procedure.result)[0]), schemas);
            return data;
        } catch (err) {
            if (err instanceof ValidationError) {
                throw new ProcedureInvocationError(err.errors, 400);
            } else {
                throw new ProcedureInvocationError([err.response.data], err.response.status)
            }
        }
    }

    private validate_spec(spec: Spec, kind: Kind) {
        const schemas: any = Object.assign({}, kind.kind_structure);
        this.validator.validate(spec, Maybe.fromValue(Object.values(kind.kind_structure)[0]), schemas);
    }

    private validate_metadata_extension(extension_structure: Data_Description, metadata: Metadata | undefined) {
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
        this.validator.validate(metadata.extension, Maybe.fromValue(Object.values(extension_structure)[0]), schemas);
    }
}