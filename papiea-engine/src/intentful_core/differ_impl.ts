import { Spec, Status, Kind, Differ, Diff, DiffContent } from "papiea-core"
import { SFSCompiler } from "./sfs_compiler"

export class BasicDiffer implements Differ {
    // Get the diff iterator from an entity based on the
    public* diffs(kind: Kind, spec: Spec, status: Status): Generator<Diff, any, undefined> {
        for (let sig of kind.intentful_signatures) {
            const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
            const result = SFSCompiler.run_sfs(compiled_signature, spec, status)
            if (result != null && result.length > 0) {
                yield {
                    kind: kind.name,
                    intentful_signature: sig,
                    diff_fields: result as DiffContent[]
                }
            }
        }
    }

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    public all_diffs(kind: Kind, spec: Spec, status: Status): Diff[] {
        return kind.intentful_signatures.map(sig => {
                const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
                const diff_fields = SFSCompiler.run_sfs(compiled_signature, spec, status)
                return {
                    kind: kind.name,
                    intentful_signature: sig,
                    diff_fields: diff_fields as DiffContent[]
                }
            }
        ).filter(diff => diff.diff_fields !== null && diff.diff_fields.length > 0)
    }

    // Removes all the status-only fields from the entity status using the schema
    public remove_status_only_fields(schema: any, status: Status): Status {
        if (schema) {
            // Return null for fields that are status-only
            if (schema.hasOwnProperty('x-papiea') && schema['x-papiea'] === 'status-only') {
                return null
            }
            if (schema.type === 'object' && status && Object.keys(status).length !== 0) {
                const properties = schema['properties']
                for (let name in properties) {
                    status[name] = this.remove_status_only_fields(properties[name], status[name])
                    // If received null i.e. a status-only field, delete the field from status object
                    if (status[name] === null) {
                        delete status[name]
                    }
                }
            } else if (schema.type === 'array' && status && status.length !== 0) {
                let i = 0;
                // Loop through all values in array and inspect status-only for each
                for (let item of status) {
                    status[i] = this.remove_status_only_fields(schema['items'], item)
                    i++
                }
                // If the array element has all status-only fields, it would be set to empty object
                // based on the above logic, so remove the element from array to avoid empty values.
                status = status.filter((item: any) => Object.keys(item).length !== 0);
            }
        }
        return status
    }

    public get_diff_path_value(diff: DiffContent, spec: Spec): any {
        let obj = spec
        for (let item of diff.path) {
            obj = obj[item]
        }
        return obj
    }
}
