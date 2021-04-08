import { Spec, Status, Kind, Differ, Diff, DiffContent, PapieaEngineTags } from "papiea-core"
import { Logger, LoggerFactory } from "papiea-backend-utils";
import { SFSCompiler } from "./sfs_compiler"

export class BasicDiffer implements Differ {
    // Get the diff iterator from an entity based on the
    public* diffs(kind: Kind, spec: Spec, status: Status, logger?: Logger): Generator<Diff, any, undefined> {
        if (logger === undefined) {
            logger = LoggerFactory.makeLogger({})
        }
        logger.debug(`BEGIN ${this.diffs.name} in basic differ`, { tags: [PapieaEngineTags.IntentfulCore] })
        for (let sig of kind.intentful_signatures) {
            const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
            const result = SFSCompiler.run_sfs(compiled_signature, spec, status, kind.kind_structure[kind.name], kind.name,logger)
            if (result != null && result.length > 0) {
                yield {
                    kind: kind.name,
                    intentful_signature: sig,
                    diff_fields: result as DiffContent[]
                }
            }
        }
        logger.debug(`END ${this.diffs.name} in basic differ`, { tags: [PapieaEngineTags.IntentfulCore] })
    }

    // We could also get the entire list of diffs, ordered by the
    // original dependency tree
    public all_diffs(kind: Kind, spec: Spec, status: Status, logger?: Logger): Diff[] {
        if (logger === undefined) {
            logger = LoggerFactory.makeLogger({})
        }
        logger.debug(`BEGIN ${this.all_diffs.name} in basic differ`, { tags: [PapieaEngineTags.IntentfulCore] })
        const diffs =  kind.intentful_signatures.map(sig => {
                const compiled_signature = SFSCompiler.try_compile_sfs(sig.signature, kind.name)
                const diff_fields = SFSCompiler.run_sfs(compiled_signature, spec, status, kind.kind_structure[kind.name], kind.name, logger)
                return {
                    kind: kind.name,
                    intentful_signature: sig,
                    diff_fields: diff_fields as DiffContent[]
                }
            }
        ).filter(diff => diff.diff_fields !== null && diff.diff_fields.length > 0)
        logger.debug(`END ${this.all_diffs.name} in basic differ`, { tags: [PapieaEngineTags.IntentfulCore] })
        return diffs
    }

    public get_diff_path_value(diff: DiffContent, spec: Spec): any {
        let obj = spec
        for (let item of diff.path) {
            obj = obj[item]
        }
        return obj
    }
}
