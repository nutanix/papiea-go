import { load } from "js-yaml";
import { readFileSync } from "fs";
import { resolve } from "path";
import { plural } from "pluralize";
import { Provider, SpecOnlyEnitityKind } from "../src/papiea";
import { Entity } from "../src/core";

export function getSpecOnlyEnitityKind(): SpecOnlyEnitityKind {
    const locationDataDescription = load(readFileSync(resolve(__dirname, "./location_kind_test_data.yml"), "utf-8"));
    const name = Object.keys(locationDataDescription)[0];
    const spec_only_kind: SpecOnlyEnitityKind = {
        name,
        name_plural: plural(name),
        kind_structure: locationDataDescription,
        validator_fn: {} as (entity: Entity) => boolean,
        intentful_signatures: new Map(),
        dependency_tree: new Map(),
        procedures: new Map(),
        differ: undefined,
        semantic_validator_fn: undefined
    };
    return spec_only_kind;
}

export function getProviderWithSpecOnlyEnitityKindNoOperations(): Provider {
    const spec_only_kind = getSpecOnlyEnitityKind();
    const providerPrefix = "test_provider";
    const providerVersion = "1";
    const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [spec_only_kind] };
    return provider;
}