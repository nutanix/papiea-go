import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";
import { plural } from "pluralize";
import {
    Data_Description,
    Version,
    Kind,
    Procedural_Signature,
    Provider,
    Procedural_Execution_Strategy
} from "papiea-core";
import * as http from "http";
import uuid = require("uuid");
import { IncomingMessage, ServerResponse } from "http"
import { IntentfulBehaviour } from "papiea-core"
const url = require("url");
const queryString = require("query-string");

function randomString(len: number) {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < len; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

export function loadYaml(relativePath: string): any {
    return load(readFileSync(resolve(__dirname, relativePath), "utf-8"));
}

export function getLocationDataDescription(): Data_Description {
    let locationDataDescription = loadYaml("./test_data/location_kind_test_data.yml");
    let randomizedLocationDataDescription: any = {};
    randomizedLocationDataDescription["Location" + randomString(5)] = locationDataDescription["Location"];
    return randomizedLocationDataDescription;
}

export function getMetadataDescription(): Data_Description {
    let MetadataDescription = loadYaml("./test_data/metadata_extension.yml");
    return MetadataDescription;
}

export function getLocationKind(): Kind {
    const locationDataDescription = getLocationDataDescription();
    const name = Object.keys(locationDataDescription)[0];
    const locationKind: Kind = {
        name,
        name_plural: plural(name),
        kind_structure: locationDataDescription,
        intentful_signatures: new Map(),
        dependency_tree: new Map(),
        kind_procedures: {},
        entity_procedures: {},
        differ: undefined,
        intentful_behaviour: IntentfulBehaviour.Basic
    };
    return locationKind;
}

function formatErrorMsg(current_field: string, missing_field: string) {
    return `Please specify ${ missing_field } before ${ current_field }`
}

const default_hostname = "127.0.0.1";
const port = 9001;

export class ProviderBuilder {
    private readonly _prefix: string;
    private _version: Version = "0.1.0";
    private _kinds: Kind[] = [];
    private _procedures: { [key: string]: Procedural_Signature; } = {};
    private _oauth2: any = undefined;
    private _extension_structure: any = {};
    private _policy: any;
    private _callback: string = `http://${ default_hostname }:${ port }/`;
    private _authModel: any;
    private _allowExtraProps: boolean = false;

    constructor(prefix?: string) {
        if (prefix !== undefined) {
            this._prefix = prefix;
        } else {
            this._prefix = randomString(12);
        }
        return this;
    }

    public build(): Provider {
        const provider: Provider = {
            prefix: this._prefix,
            version: this._version,
            kinds: this._kinds,
            oauth2: this._oauth2,
            procedures: this._procedures,
            extension_structure: this._extension_structure,
            policy: this._policy,
            authModel: this._authModel,
            allowExtraProps: this._allowExtraProps
        };
        return provider;
    }

    get prefix(): string {
        return this._prefix;
    }

    get oauth2(): any {
        return this._oauth2;
    }

    get policy(): any {
        return this._policy
    }

    get allowExtraProps(): boolean {
        return this._allowExtraProps
    }

    public withAllowExtraProps(allowExtraProps: boolean) {
        this._allowExtraProps = allowExtraProps
    }

    public withCallback(address: string) {
        this._callback = address;
        return this;
    }

    get callback() {
        return this._callback;
    }

    public withPolicy(value?: any) {
        if (value === undefined) {
            this._policy = undefined
        } else {
            this._policy = value
        }
        return this;
    }

    get extensionStructure() {
        return this._extension_structure;
    }

    public withExtensionStructure(value?: any) {
        if (value === undefined) {
            this._extension_structure = getMetadataDescription();
        } else {
            this._extension_structure = value
        }
        return this;
    }

    public withOAuth2Description(value?: any) {
        if (value === undefined) {
            this._oauth2 = loadYaml("./test_data/auth.yaml");
        } else {
            this._oauth2 = value
        }
        return this;
    }

    public withAuthModel(value?: any) {
        if (value === undefined) {
            const pathToModel: string = resolve(__dirname, "../src/auth/provider_model_example.txt");
            const modelText: string = readFileSync(pathToModel).toString();
            this._authModel = modelText;
        } else {
            this._authModel = value
        }
        return this;
    }

    public withProviderProcedures(value?: { [p: string]: Procedural_Signature }) {
        if (value === undefined) {
            const proceduralSignatureForProvider: Procedural_Signature = {
                name: "computeSum",
                argument: loadYaml("./test_data/procedure_sum_input.yml"),
                result: loadYaml("./test_data/procedure_sum_output.yml"),
                execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
                procedure_callback: this._callback
            };
            this._procedures[proceduralSignatureForProvider.name] = proceduralSignatureForProvider;
        } else {
            this._procedures = value;
        }
        return this;
    }

    get providerProcedures(): { [p: string]: Procedural_Signature } {
        return this._procedures;
    }

    get kindProcedures(): { [p: string]: Procedural_Signature } {
        return this._kinds[0].kind_procedures;
    }

    public withKindProcedures(value?: { [p: string]: Procedural_Signature }) {
        if (value === undefined) {
            const geolocationComputeProceduralSignature: Procedural_Signature = {
                name: "computeGeolocation",
                argument: loadYaml("./test_data/procedure_geolocation_compute_input.yml"),
                result: loadYaml("./test_data/procedure_geolocation_compute_input.yml"),
                execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
                procedure_callback: this._callback
            };
            if (this._kinds.length >= 1) {
                this._kinds[0].kind_procedures[geolocationComputeProceduralSignature.name] = geolocationComputeProceduralSignature
            } else {
                throw new Error(formatErrorMsg("Kind Procedures", "Kinds"))
            }
        } else {
            if (this._kinds.length >= 1) {
                this._kinds[0].kind_procedures = value
            } else {
                throw new Error(formatErrorMsg("Kind Procedures", "Kinds"))
            }
        }
        return this;
    }

    get entityProcedures(): { [p: string]: Procedural_Signature } {
        return this._kinds[0].entity_procedures;
    }

    public withEntityProcedures(value?: { [p: string]: Procedural_Signature }) {
        if (value === undefined) {
            const proceduralSignatureForKind: Procedural_Signature = {
                name: "moveX",
                argument: loadYaml("./test_data/procedure_move_input.yml"),
                result: loadYaml("./test_data/location_kind_test_data.yml"),
                execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
                procedure_callback: this._callback
            };
            if (this._kinds.length >= 1) {
                this._kinds[0].entity_procedures[proceduralSignatureForKind.name] = proceduralSignatureForKind
            } else {
                throw new Error(formatErrorMsg("Entity Procedures", "Kinds"))
            }
        } else {
            if (this._kinds.length >= 1) {
                this._kinds[0].entity_procedures = value
            } else {
                throw new Error(formatErrorMsg("Entity Procedures", "Kinds"))
            }
        }
        return this;
    }

    get kinds(): Kind[] {
        return this._kinds;
    }

    public withKinds(value?: Kind[]) {
        if (value === undefined) {
            this._kinds = [getLocationKind()];
        } else {
            this._kinds = value;
        }
        return this;
    }

    get version(): Version {
        return this._version;
    }

    public withVersion(value: Version) {
        this._version = value;
        return this;
    }
}

interface DoneCallback {
    (...args: any[]): any;

    fail(error?: string | { message: string }): any;
}

export class ValidationBuilder {
    static createSimpleValidationFunc(done: DoneCallback): (func: () => void, shouldFail?: boolean) => void | never  {
        return function tryValidate(func: () => void, shouldFail: boolean = false): void | never {
            if (shouldFail) {
                try {
                    func();
                    done.fail(new Error("Falsely validated function"));
                } catch (e) {
                    done();
                }
            } else {
                try {
                    func();
                    done();
                } catch (e) {
                    console.error(e);
                    done.fail(e);
                }
            }
        }
    };
}

function base64UrlEncode(...parts: any[]): string {
    function base64UrlEncodePart(data: any): string {
        return Buffer.from(JSON.stringify(data))
            .toString('base64')
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=+$/, '');
    }
    return parts.map(x => base64UrlEncodePart(x)).join('.');
}

function createToken(expireIn: number) {
    const timestampDate = new Date().getTime()
    const timestamp = timestampDate / 1000
    const expirationDate = new Date(timestampDate)
    expirationDate.setSeconds(expirationDate.getSeconds() + expireIn)
    const expiration = expirationDate.getTime() / 1000
    const access = base64UrlEncode({
            "alg": "RS256"
        },
        {
            "created_by": "papiea",
            "azp": "EEE",
            "sub": "alice",
            "default_tenant": OAuth2Server.tenant_uuid,
            "iss": "https:\/\/127.0.0.1:9002\/oauth2\/token",
            "given_name": "Alice",
            "iat": timestamp,
            "exp": expiration,
            "email": "alice@localhost",
            "last_name": "Doe",
            "aud": ["EEE"],
            "role": "COMMUNITY,Internal\/everyone",
            "jti": uuid(),
            "user_id": uuid()
        });

    const id = base64UrlEncode(
        {
            "alg": "RS256",
            "x5t": "AAA",
            "kid": "BBB"
        }, {
            "azp": "EEE",
            "sub": "alice",
            "at_hash": "DDD",
            "default_tenant": OAuth2Server.tenant_uuid,
            "iss": "https:\/\/127.0.0.1:9002\/oauth2\/token",
            "given_name": "Alice",
            "iat": timestamp,
            "xi_role": base64UrlEncode([{
                "tenant-domain": OAuth2Server.tenant_uuid,
                "tenant-status": "PROVISIONED",
                "tenant-name": "someTenant",
                "roles": [{ "name": "account-admin" }, { "name": "papiea-admin" }],
                "tenant-owner-email": "someTenant@localhost",
                "account_approved": true,
                "tenant-properties": {
                    "sfdc-accountid": "xyztest",
                    "tenant-uuid": OAuth2Server.tenant_uuid
                }
            }]),
            "auth_time": timestamp,
            "exp": expiration,
            "email": "alice@localhost",
            "aud": ["EEE"],
            "last_name": "Doe",
            "role": ["COMMUNITY", "Internal\/everyone"],
            "federated_idp": "local"
        });

    const idpToken = JSON.stringify({
        scope: 'openid',
        token_type: 'Bearer',
        expires_in: expiration - timestamp,
        refresh_token: uuid(),
        id_token: id,
        access_token: access
    });
    return idpToken
}

export class OAuth2Server {
    static tenant_uuid = uuid();
    readonly idp_token: any
    httpServer: http.Server

    constructor(ttlSeconds: number) {
        this.httpServer = http.createServer((req, res) => {
            this.resolve(req, res)
        });
        this.idp_token = createToken(ttlSeconds)
    }

    get_actions(): { [key: string]: http.RequestListener } {
        return {
            "/oauth2/authorize": (req: IncomingMessage, res: ServerResponse) => {
                const params = queryString.parse(url.parse(req.url).query)
                if (!params.redirect_uri) {
                    res.statusCode = 401
                    res.end(JSON.stringify({
                        redirected: true
                    }))
                    return
                }
                const resp_query = queryString.stringify({
                    state: params.state,
                    code: 'ZZZ'
                })
                res.statusCode = 302
                res.setHeader('Location', params.redirect_uri + '?' + resp_query)
                res.end()
            },
            "/oauth2/logout": (req: IncomingMessage, res: ServerResponse) => {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end()
            },
        }
    }

    post_actions(): { [key: string]: http.RequestListener } {
        const idp = this.idp_token
        return {
            "/oauth2/token": (req: IncomingMessage, res: ServerResponse) => {
                let body = ''
                req.on('data', function (data) {
                    body += data
                })
                req.on('end', function () {
                    if (queryString.parse(body).grant_type === "refresh_token") {
                        res.statusCode = 200
                        res.setHeader('Content-Type', 'application/json')
                        res.end(createToken(60 * 60 * 4))
                    } else {
                        res.statusCode = 200
                        res.setHeader('Content-Type', 'application/json')
                        res.end(idp)
                    }
                })
            },
            "/oauth2/revoke": (req: IncomingMessage, res: ServerResponse) => {
                res.statusCode = 200
                res.end()
            }
        }
    }

    static createServer(tokenTTLSeconds?: number) {
        if (tokenTTLSeconds) {
            return new OAuth2Server(tokenTTLSeconds)
        }
        return new OAuth2Server(60 * 60 * 2)
    }

    private resolve(req: IncomingMessage, res: ServerResponse) {
        const url: string | undefined = req.url
        if (!url) {
            throw new Error("No url was provided")
        }
        const baseUrl = url.split("?")[0]
        if (req.method === "GET") {
            this.get_actions()[baseUrl](req, res)
        } else if (req.method === "POST") {
            this.post_actions()[baseUrl](req, res)
        }
    }

}
