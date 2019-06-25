import {
    ProceduralCtx_Interface,
    Provider as ProviderImpl,
    Provider_Power,
    IntentfulCtx_Interface,
} from "./typescript_sdk_interface";
import axios, { AxiosInstance } from "axios"
import { plural } from "pluralize"
import * as express from "express";
import * as asyncHandler from "express-async-handler";
import { Express, RequestHandler } from "express";
import { Server } from "http";
import { ProceduralCtx } from "./typescript_sdk_context_impl";
import { Version, Kind, Procedural_Signature, Provider, Data_Description, SpecOnlyEntityKind, Procedural_Execution_Strategy, Entity } from "papiea-core";
import { ValidationError, Validator } from "./typescript_sdk_validation";
import { Maybe } from "./typescript_sdk_utils";

export class ProviderSdk implements ProviderImpl {
    private readonly _kind: Kind[];
    private readonly _procedures: { [key: string]: Procedural_Signature };
    private readonly validator: Validator;
    private readonly server_manager: Provider_Server_Manager;
    private readonly providerApi: AxiosInstance;
    private _version: Version | null;
    private _prefix: string | null;
    private meta_ext: { [key: string]: string };
    private _provider: Provider | null;
    private readonly papiea_url: string;
    private readonly s2skey: string;
    private _policy: string | null = null;
    private _oauth2: string | null = null;
    private _authModel: any | null = null;

    constructor(papiea_url: string, s2skey: string, server_manager?: Provider_Server_Manager, validator?: Validator) {
        this._version = null;
        this._prefix = null;
        this._kind = [];
        this._provider = null;
        this.papiea_url = papiea_url;
        this.s2skey = s2skey;
        this.server_manager = server_manager || new Provider_Server_Manager();
        this._procedures = {};
        this.meta_ext = {};
        this.validator = validator || new Validator(true);
        this.get_prefix = this.get_prefix.bind(this);
        this.get_version = this.get_version.bind(this);
        this.providerApi = axios.create({
            baseURL: this.provider_url,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.s2skey}`
            }
        });
    }

    get provider() {
        if (this._provider !== null) {
            return this._provider
        } else {
            throw Error("Provider not created")
        }
    }

    get provider_url(): string {
        return `${ this.papiea_url }/provider`
    }

    get entity_url(): string {
        return `${ this.papiea_url }/services`
    }

    private get_prefix(): string {
        if (this._prefix !== null) {
            return this._prefix
        } else {
            throw new Error("Provider prefix is not set")
        }
    }

    private get_version(): string {
        if (this._version !== null) {
            return this._version
        } else {
            throw new Error("Provider version is not set")
        }
    }

    get server(): Server {
        return this.server_manager.server;
    }

    new_kind(entity_description: Data_Description, validator?: Validator): Kind_Builder {
        if (Object.keys(entity_description).length === 0) {
            throw new Error("Wrong kind description specified")
        }
        const name = Object.keys(entity_description)[0];
        if (entity_description[name].hasOwnProperty("x-papiea-entity")) {
            if (entity_description[name]["x-papiea-entity"] === "spec-only") {
                const spec_only_kind: SpecOnlyEntityKind = {
                    name,
                    name_plural: plural(name),
                    kind_structure: entity_description,
                    intentful_signatures: new Map(),
                    dependency_tree: new Map(),
                    kind_procedures: {},
                    entity_procedures: {},
                    differ: undefined,
                };
                const kind_builder = new Kind_Builder(spec_only_kind, this.entity_url, this.provider_url, this.get_prefix, this.get_version, this.server_manager, this.providerApi, validator || this.validator);
                this._kind.push(spec_only_kind);
                return kind_builder;
            } else {
                //TODO: process non spec-only
                throw new Error("Unimplemented")
            }
        } else {
            throw new Error(`Entity not a papiea entity. Please make sure you have 'x-papiea-entity' property for '${name}'`);
        }
    }

    add_kind(kind: Kind): Kind_Builder | null {
        if (this._kind.indexOf(kind) === -1) {
            this._kind.push(kind);
            const kind_builder = new Kind_Builder(kind, this.entity_url, this.provider_url, this.get_prefix, this.get_version, this.server_manager, this.providerApi);
            return kind_builder;
        } else {
            return null;
        }
    }

    remove_kind(kind: Kind): boolean {
        const found_idx = this._kind.indexOf(kind);
        if (found_idx !== -1) {
            this._kind.splice(found_idx, 1);
            return true;
        } else {
            return false;
        }
    }

    version(version: Version): ProviderSdk {
        this._version = version;
        return this
    }

    prefix(prefix: string): ProviderSdk{
        this._prefix = prefix;
        return this
    }

    metadata_extension(ext: Data_Description): ProviderSdk {
        this.meta_ext = ext;
        return this
    }

    provider_procedure(name: string, rbac: any,
                       strategy: Procedural_Execution_Strategy,
                       input_desc: any,
                       output_desc: any,
                       handler: (ctx: ProceduralCtx_Interface, input: any) => Promise<any>): ProviderSdk {
        const callback_url = this.server_manager.callback_url(name);
        const procedural_signature: Procedural_Signature = {
            name,
            argument: input_desc,
            result: output_desc,
            execution_strategy: strategy,
            procedure_callback: callback_url
        };
        this._procedures[name] = procedural_signature;
        const prefix = this.get_prefix();
        const version = this.get_version();
        this.server_manager.register_handler("/" + name, async (req, res) => {
            try {
                const result = await handler(new ProceduralCtx(this.provider_url, this.entity_url, prefix, version, this.providerApi), req.body.input);
                this.validator.validate(result, Maybe.fromValue(Object.values(output_desc)[0]), Validator.build_schemas(input_desc, output_desc));
                res.json(result);
            } catch (e) {
                if (e instanceof ValidationError) {
                    console.error(`Provider procedure ${name} didn't return correct value`, e)
                    return res.status(422).json(e.mapErr(errors => `Provider procedure ${name} didn't return correct value`))
                }
                throw new Error("Unable to execute handler");
            }
        });
        return this
    }


    async register(): Promise<void> {
        if (this._prefix !== null && this._version !== null && this._kind.length !== 0) {
            this._provider = {
                kinds: [...this._kind],
                version: this._version!,
                prefix: this._prefix!,
                procedures: this._procedures,
                extension_structure: this.meta_ext,
                ...(this._policy) && {policy: this._policy},
                ...(this._oauth2) && {oauth2: this._oauth2},
                ...(this._authModel) && {authModel: this._authModel}
            };
            try {
                await this.providerApi.post('/', this._provider);
                this.server_manager.startServer();
            } catch (err) {
                throw err;
            }
        } else if (this._prefix === null) {
            ProviderSdk.provider_description_error("prefix")
        } else if (this._version === null) {
            ProviderSdk.provider_description_error("version")
        } else if (this._kind.length === 0) {
            ProviderSdk.provider_description_error("kind")
        }
    }

    power(state: Provider_Power): Provider_Power {
        throw new Error("Unimplemented")
    }

    private static provider_description_error(missing_field: string) {
        throw new Error(`Malformed provider description. Missing: ${ missing_field }`)
    }

    static create_provider(papiea_url: string, s2skey: string, public_host?: string, public_port?: number, validator?: Validator): ProviderSdk {
        const server_manager = new Provider_Server_Manager(public_host, public_port);
        return new ProviderSdk(papiea_url, s2skey, server_manager, validator)
    }

    public secure_with(oauth_config: any, casbin_model: string, casbin_initial_policy: string) : ProviderSdk {
        this._oauth2=oauth_config
        this._authModel=casbin_model
        this._policy=casbin_initial_policy
        return this
    }
}

class Provider_Server_Manager {
    private readonly public_host: string;
    private readonly public_port: number;
    private app: Express;
    private raw_http_server: Server | null;
    private should_run: boolean;

    constructor(public_host: string = "127.0.0.1", public_port: number = 9000) {
        this.public_host = public_host;
        this.public_port = public_port;
        this.app = express();
        this.init_express();
        this.raw_http_server = null;
        this.should_run = false;
    }

    init_express() {
        this.app.use(express.json())
    }

    register_handler(route: string, handler: RequestHandler) {
        if (!this.should_run) {
            this.should_run = true;
        }
        this.app.post(route, asyncHandler(handler))
    }

    startServer() {
        if (this.should_run) {
            this.raw_http_server = this.app.listen(this.public_port, () => {
                console.log(`Server running at http://localhost:${ this.public_port }/`);
            })
        }
    }

    get server(): Server {
        if (this.raw_http_server !== null) {
            return this.raw_http_server;
        } else {
            throw Error("Server is not created")
        }
    }

    callback_url(procedure_name: string, kind?: string): string {
        if (kind !== undefined) {
            return `http://${ this.public_host }:${ this.public_port }${ "/" + kind + "/" + procedure_name }`
        } else {
            return `http://${ this.public_host }:${ this.public_port }${ "/" + procedure_name }`
        }
    }
}
export class Kind_Builder {

    kind: Kind;
    entity_url: string;
    get_prefix: () => string;
    get_version: () => string;
    private server_manager: Provider_Server_Manager;
    provider_url: string;
    private validator: Validator;
    private readonly providerApi: AxiosInstance;

    constructor(kind: Kind, entity_url: string, provider_url:string, get_prefix: () => string, get_version: () => string, server_manager: Provider_Server_Manager, providerApi:AxiosInstance, validator?: Validator) {
        this.server_manager = server_manager;
        this.kind = kind;
        this.entity_url = entity_url;
        this.get_prefix = get_prefix;
        this.get_version = get_version;
        this.provider_url = provider_url;
        this.providerApi = providerApi;
        this.validator = validator || new Validator(true);
    }

    entity_procedure(name: string, rbac: any,
                     strategy: Procedural_Execution_Strategy,
                     input_desc: any,
                     output_desc: any,
                     handler: (ctx: ProceduralCtx_Interface, entity: Entity, input: any) => Promise<any>): Kind_Builder {
        const callback_url = this.server_manager.callback_url(name, this.kind.name);
        const procedural_signature: Procedural_Signature = {
            name,
            argument: input_desc,
            result: output_desc,
            execution_strategy: strategy,
            procedure_callback: callback_url
        };
        this.kind.entity_procedures[name] = procedural_signature;
        const prefix = this.get_prefix();
        const version = this.get_version();
        this.server_manager.register_handler(`/${this.kind.name}/${name}`, async (req, res) => {
            try {
                const result = await handler(new ProceduralCtx(this.provider_url, this.entity_url, prefix, version, this.providerApi), {
                    metadata: req.body.metadata,
                    spec: req.body.spec,
                    status: req.body.status
                }, req.body.input);
                this.validator.validate(result, Maybe.fromValue(Object.values(output_desc)[0]), Validator.build_schemas(input_desc, output_desc));
                res.json(result);
            } catch (e) {
                if (e instanceof ValidationError) {
                    return res.status(422).json(e.mapErr(errors => `Entity procedure '${name}' didn't return correct value`))
                }
                throw new Error(`Unable to execute handler '${e.message}'`);
            }
        });
        return this
    }

    kind_procedure(name: string, rbac: any,
                   strategy: Procedural_Execution_Strategy,
                   input_desc: any,
                   output_desc: any,
                   handler: (ctx: ProceduralCtx_Interface, input: any) => Promise<any>): Kind_Builder {
        const callback_url = this.server_manager.callback_url(name, this.kind.name);
        const procedural_signature: Procedural_Signature = {
            name,
            argument: input_desc,
            result: output_desc,
            execution_strategy: strategy,
            procedure_callback: callback_url
        };
        this.kind.kind_procedures[name] = procedural_signature;
        const prefix = this.get_prefix();
        const version = this.get_version();
        this.server_manager.register_handler(`/${this.kind.name}/${name}`, async (req, res) => {
            try {
                const result = await handler(new ProceduralCtx(this.provider_url, this.entity_url, prefix, version, this.providerApi), req.body.input);
                this.validator.validate(result, Maybe.fromValue(Object.values(output_desc)[0]), Validator.build_schemas(input_desc, output_desc));
                res.json(result);
            } catch (e) {
                if (e instanceof ValidationError) {
                    return res.status(422).json(e.mapErr(errors => `Kind procedure ${name} didn't return correct value`))
                }
                throw new Error(`Unable to execute handler '${e.message}'`);
            }
        });
        return this
    }
}
export {Version, Kind, Procedural_Signature, Provider, Data_Description, SpecOnlyEntityKind, Procedural_Execution_Strategy, Entity, ProceduralCtx_Interface, Provider_Power, IntentfulCtx_Interface}