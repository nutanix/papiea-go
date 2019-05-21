import { SFS, Entity_Reference, Spec, Status, Provider_Callback_URL, Kind_Compiler, Kind, Differ, Diff } from "papiea-core";


export class Compiler implements Kind_Compiler {
    public compile_kind_explicit(sfss: SFS[], dep_tree: Map<SFS, SFS[]>): TheDiffer {
        return new TheDiffer();
    }

    // More concisely this could simply be:
    public compile_kind(kind: Kind): TheDiffer {
        return new TheDiffer();
    }
}

export let compiler = new Compiler();

export class TheDiffer implements Differ  {
    // Get the next diff from an entity based on the 
    public next_diff(entity:Entity_Reference, spec: Spec, status: Status):TheDiff {
        return new TheDiff("test", new Map(), "name");
    }

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    public all_diffs(entity:Entity_Reference, spec: Spec, status: Status):TheDiff[] {
        return [new TheDiff("testall", new Map(), "nameall")];
    }
}

export class TheDiff implements Diff {

    // The uri exposed by the provider which may handle this diff
    intentful_fn_uri: Provider_Callback_URL

    // If this intent handler has a name, we could use it
    name?: string;

    // The fields identified by this differ, their path and value.
    diff_fields: Map<SFS, any>;

    constructor(callback: Provider_Callback_URL, diff_fields: Map<SFS, any>, name?: string) {
        this.intentful_fn_uri = callback;
        this.name = name;
        this.diff_fields = diff_fields;
    }
    
    public invoke() {
        return "Yes!";
    }
}
