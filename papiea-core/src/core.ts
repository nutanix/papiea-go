// [[file:~/work/papiea-js/Papiea-design.org::*/src/core.ts][/src/core.ts:1]]
// This should probably be imported from some library
export type uuid4 = string;

// [[file:~/work/papiea-js/Papiea-design.org::#h-Coretypes-732][core-types]]
// Calback url is just a string
export type Provider_Callback_URL = string;

// Store a struct description parsed from Swagger Model YAML
export type Data_Description = any;

// Lets define a type for a version. For now it may be string, but could be more
// elaborate later on
export type Version = string;
// core-types ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Metadata-350][metadata-struct]]
export interface Metadata {
    // Identity fields
    uuid: uuid4;
    kind: string;
    spec_version: number;

    // Additional fields
    created_at: Date;
    deleted_at?: Date;
    extension: {
        [key: string]: any;
    }
}
// metadata-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Spec-715][spec-struct]]
export type Spec = any;
// spec-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Status-990][status-struct]]
export type Status = any;
// status-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Entity-43][entity-struct]]
export interface Entity {
  metadata: Metadata;
  spec: Spec;
  status: Status
}
// entity-struct ends here

export interface EntitySpec {
    metadata: Metadata,
    spec: Spec
}

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interfaces-559][SFS-interfaces]]
// Intentful signature
export type SFS = string;

export interface Intentful_Signature {
    signature: SFS;
    compiled_signature: any
    function_callback: Provider_Callback_URL;
}
// SFS-interfaces ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Entity-Reference-396][entity-reference-struct]]
export interface Entity_Reference  {
    uuid: uuid4;
    kind: string;

    // This field is optional and is only used help the user identify
    // what this reference is pointing to. 
    name?: string;
}
// entity-reference-struct ends here
// /src/core.ts:1 ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Differ-118][Differ-interface]]
export interface Kind_Compiler {
    // The sfss compiler function. 
    compile_kind_explicit(sfss: SFS[], dep_tree: Map<SFS, SFS[]>): Differ;

    // More concisely this could simply be:
    compile_kind(kind: Kind): Differ;
}

// The differ is used to locate a diff in an entity between the
// current status and the desired state. 
export interface Differ {

    // Get the next diff from an entity based on the 
    next_diff(entity:Entity_Reference, spec: Spec, status: Status):Diff;

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    all_diffs(entity:Entity_Reference, spec: Spec, status: Status):Diff[];
}

// [[file:~/work/papiea-js/Papiea-design.org::#h-Kind-241][kind-struct]]
export interface Kind {

    // The name of the kind, and its plural form for proper REST naming
    name: string;
    name_plural?: string;

    //// Entity structure
    kind_structure: Data_Description;

    //// Intentful behavior
    intentful_signatures: Map<SFS, Intentful_Signature>;

    // Every sfs lists the sfs's it has to execute before
    dependency_tree: Map<SFS, SFS[]>;

    // The compiled Differ
    differ?: Differ;

    //// Procedural behavior
    entity_procedures: { [key: string]: Procedural_Signature; }
    kind_procedures: { [key: string]: Procedural_Signature; };
}

// [[file:~/work/papiea-js/Papiea-design.org::#h-Intentful-Execution-821][Diff-interface]]
// The Diff structure captures a discovered diff in an entity as well
// as the intentful action that may resolve such diff
export interface Diff {
    // The uri exposed by the provider which may handle this diff
    intentful_fn_uri: Provider_Callback_URL

    // If this intent handler has a name, we could use it
    name?: string;

    // The fields identified by this differ, their path and value.
    diff_fields: Map<SFS, any>;

    // Actually invokes the intentful function
    invoke(): any;
}
// Diff-interface ends here
// /src/intentful_core/differ_interface.ts:1 ends here


export interface SpecOnlyEntityKind extends Kind {
}

// kind-struct ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-598][entity_procedure-signature]]
// We may want to support different execution strategies. For now we
// can only halt intentful execution for the duration of the
// procedural call
export enum Procedural_Execution_Strategy {Halt_Intentful};

export interface Procedural_Signature {
    // The name of the entity_procedure to be exported by the engine.
    name: string;

    // The representation of the data to be passed to this entity_procedure
    argument: Data_Description;

    // The representation of the data to be returned from this entity_procedure
    result: Data_Description;

    // Does the engine pauses all intentful operation invocations for
    // the duration of the procedural call
    execution_strategy: Procedural_Execution_Strategy;

    // Action url into the provider
    procedure_callback: Provider_Callback_URL;
}

// entity_procedure-signature ends here

// [[file:~/work/papiea-js/Papiea-design.org::#h-Provider-description-189][provider-desc-struct]]
export interface Provider {
    // A unique identifier where all kinds will be under this prefix
    prefix: string;
    version: Version;
    kinds: Kind[];
    procedures: { [key: string]: Procedural_Signature; };
    extension_structure: Data_Description
    created_at?: Date;
    policy?: string;
    oauth2?: any;
    authModel?: string;
}

// Add support for partial types where relevant
export type Partial<T> = {
    [P in keyof T]?: T[P];
};

export type Key = string
export interface UserInfo {
    [key: string]: any;
}

export interface S2S_Key {
    name?: string
    owner: string
    provider_prefix: string
    key: Key

    // Additional fields
    created_at: Date
    deleted_at?: Date
    extension: UserInfo 
}


// Modeled after https://developers.google.com/drive/api/v3/handle-errors
export interface PapieaError {
    error: {
        errors: { [key: string]: any }[],
        code: number
        message: string
    }
}
