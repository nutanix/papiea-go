import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";
import { plural } from "pluralize";
import { Data_Description, Version, SpecOnlyEntityKind, Kind, Procedural_Signature, Provider, Procedural_Execution_Strategy } from "papiea-core";

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
    let locationDataDescription = loadYaml("./location_kind_test_data.yml");
    let randomizedLocationDataDescription: any = {};
    randomizedLocationDataDescription["Location" + randomString(5)] = locationDataDescription["Location"];
    return randomizedLocationDataDescription;
}

export function getMetadataDescription(): Data_Description {
    let MetadataDescription = loadYaml("./metadata_extension.yml");
    return MetadataDescription;
}

export function getSpecOnlyEntityKind(): SpecOnlyEntityKind {
    const locationDataDescription = getLocationDataDescription();
    const name = Object.keys(locationDataDescription)[0];
    const spec_only_kind: SpecOnlyEntityKind = {
        name,
        name_plural: plural(name),
        kind_structure: locationDataDescription,
        intentful_signatures: new Map(),
        dependency_tree: new Map(),
        kind_procedures: {},
        entity_procedures: {},
        differ: undefined,
    };
    return spec_only_kind;
}

function formatErrorMsg(current_field: string, missing_field: string) {
    return `Please specify ${missing_field} before ${current_field}`
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
    private _callback: string = `http://${default_hostname}:${port}/`;

    constructor(prefix?: string) {
        if (prefix !== undefined) {
            this._prefix = prefix;
        } else {
            this._prefix = randomString(12);
        }
        return this;
    }

    public build(): Provider {
        const provider: Provider = { prefix: this._prefix, version: this._version, kinds: this._kinds,
            oauth2: this._oauth2, procedures: this._procedures, extension_structure: this._extension_structure, policy: this._policy};
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
            this._oauth2 = loadYaml("./auth.yaml");
        } else {
            this._oauth2 = value
        }
        return this;
    }

    public withProviderProcedures(value?: { [p: string]: Procedural_Signature }) {
        if (value === undefined) {
            const proceduralSignatureForProvider: Procedural_Signature = {
                name: "computeSum",
                argument: loadYaml("./procedure_sum_input.yml"),
                result: loadYaml("./procedure_sum_output.yml"),
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
                argument: loadYaml("./procedure_geolocation_compute_input.yml"),
                result: loadYaml("./procedure_geolocation_compute_input.yml"),
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
                argument: loadYaml("./procedure_move_input.yml"),
                result: loadYaml("./location_kind_test_data.yml"),
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
            this._kinds = [getSpecOnlyEntityKind()];
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
