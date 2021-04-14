import {
    Spec,
    Status,
    Kind,
    Differ,
    Diff,
    DiffContent,
    Intentful_Signature,
    Provider_Entity_Reference
} from "papiea-core"
import { Logger } from "papiea-backend-utils";
import { SFSCompiler } from "./sfs_compiler"
import * as hash from "object-hash"

export class BasicDiffer implements Differ {
    // Get the diff iterator from an entity based on the
    public* diffs(entity_reference: Provider_Entity_Reference, kind: Kind, spec: Spec, status: Status, logger?: Logger): Generator<Diff, any, undefined> {
        for (let sig of kind.intentful_signatures) {
            const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
            const result = SFSCompiler.run_sfs(compiled_signature, spec, status, kind.kind_structure[kind.name], kind.name,logger)
            if (result != null && result.length > 0) {
                yield this.create_diff_structure(entity_reference, sig, result)
            }
        }
    }

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    public all_diffs(entity_reference: Provider_Entity_Reference, kind: Kind, spec: Spec, status: Status, logger?: Logger): Diff[] {
        const diffs = []
        for (let sig of kind.intentful_signatures) {
            const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
            const result = SFSCompiler.run_sfs(compiled_signature, spec, status, kind.kind_structure[kind.name], kind.name,logger)
            if (result != null && result.length > 0) {
                diffs.push(this.create_diff_structure(entity_reference, sig, result))
            }
        }
        return diffs
    }

    public get_diff_path_value(diff: DiffContent, spec: Spec): any {
        let obj = spec
        for (let item of diff.path) {
            obj = obj[item]
        }
        return obj
    }

    public create_diff_structure(entity_reference: Provider_Entity_Reference, signature: Intentful_Signature, diff_fields: DiffContent[]): Diff {
        const hashed = hash({entity_reference: {
                uuid: entity_reference.uuid,
                kind: entity_reference.kind,
                provider_prefix: entity_reference.provider_prefix,
                provider_version: entity_reference.provider_version
            }, intentful_signature: signature, diff_fields: diff_fields})
        return {
            entity_reference: entity_reference,
            intentful_signature: signature,
            diff_fields: diff_fields,
            id: hashed,
            handler_url: `${signature.base_callback}/healthcheck`
        }
    }
}
