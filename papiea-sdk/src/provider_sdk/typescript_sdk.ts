import { ProceduralCtx_Interface, Provider as ProviderImpl, Provider_Power } from "./typescript_sdk_interface";
import axios from "axios"
import { plural } from "pluralize"
import * as express from "express";
import * as asyncHandler from "express-async-handler";
import { Express, RequestHandler } from "express";
import { Server } from "http";
import { ProceduralCtx } from "./typescript_sdk_context_impl";
import { Version, Kind, Procedural_Signature, Provider, Data_Description, SpecOnlyEntityKind, Procedural_Execution_Strategy, Entity } from "papiea-core/build/core";


export class ProviderSdk implements ProviderImpl {
    private _version: Version | null;
    private _prefix: string | null;
    private readonly _kind: Kind[];
    private readonly _procedures: { [key: string]: Procedural_Signature };
    _provider: Provider | null;
    papiea_url: string;
    papiea_port: number;
    private meta_ext: { [key: string]: string };
    private readonly server_manager: Provider_Server_Manager;


    constructor(papiea_url: string, papiea_port: number, server_manager?: Provider_Server_Manager) {
        this._version = null;
        this._prefix = null;
        this._kind = [];
        this._provider = null;
        this.papiea_url = papiea_url;
        this.papiea_port = papiea_port;
        this.server_manager = server_manager || new Provider_Server_Manager();
        this._procedures = {};
        this.meta_ext = {};
        this.get_prefix = this.get_prefix.bind(this);
        this.get_version = this.get_version.bind(this);
    }

    get provider() {
        if (this._provider !== null) {
            return this._provider
        } else {
            throw Error("Provider not created")
        }
    }

    get entity_url(): string {
        return `http://${ this.papiea_url }:${ this.papiea_port }/services`
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

    new_kind(entity_description: Data_Description): Kind_Builder {
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
                    procedures: {},
                    differ: undefined,
                };
                const kind_builder = new Kind_Builder(spec_only_kind, this.entity_url, this.get_prefix, this.get_version, this.server_manager);
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
            const kind_builder = new Kind_Builder(kind, this.entity_url, this.get_prefix, this.get_version, this.server_manager);
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
                const result = await handler(new ProceduralCtx(this.entity_url, prefix, version), req.body.input);
                res.json(result);
            } catch (e) {
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
                extension_structure: this.meta_ext
            };
            try {
                await axios.post(`http://${ this.papiea_url }:${ this.papiea_port }/provider/`, this._provider);
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

    static create_provider(papiea_host: string, papiea_port: number, public_host?: string, public_port?: number): ProviderSdk {
        const server_manager = new Provider_Server_Manager(public_host, public_port);
        return new ProviderSdk(papiea_host, papiea_port, server_manager)
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

    constructor(kind: Kind, entity_url: string, get_prefix: () => string, get_version: () => string, server_manager: Provider_Server_Manager) {
        this.server_manager = server_manager;
        this.kind = kind;
        this.entity_url = entity_url;
        this.get_prefix = get_prefix;
        this.get_version = get_version;
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
        this.kind.procedures[name] = procedural_signature;
        const prefix = this.get_prefix();
        const version = this.get_version();
        this.server_manager.register_handler(`/${this.kind.name}/${name}`, async (req, res) => {
            try {
                const result = await handler(new ProceduralCtx(this.entity_url, prefix, version), {
                    metadata: req.body.metadata,
                    spec: req.body.spec,
                    status: req.body.status
                }, req.body.input);
                res.json(result.spec);
            } catch (e) {
                throw new Error("Unable to execute handler");
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
        this.kind.procedures[name] = procedural_signature;
        const prefix = this.get_prefix();
        const version = this.get_version();
        this.server_manager.register_handler(`/${this.kind.name}/${name}`, async (req, res) => {
            try {
                const result = await handler(new ProceduralCtx(this.entity_url, prefix, version), req.body.input);
                res.json(result);
            } catch (e) {
                throw new Error("Unable to execute handler");
            }
        });
    return this   
    }
}