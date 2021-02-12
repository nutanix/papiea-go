import { ValidationError } from "../errors/validation_error"
import {DiffContent} from "papiea-core"

// TODO: add d.ts for type annotations
const papi_clj = require("../../papiea-lib-clj/papiea-lib-clj.js").papiea_lib_clj;
const clj_str = (a: any) => papi_clj.core.clj_str(a);
const sfs_parser = (sfs_ast: string) => papi_clj.core.parse_sfs(sfs_ast);
const sfs_optimizer = (sfs_ast: string) => papi_clj.core.optimize_sfs_ast(sfs_ast);
const sfs_compiler = (sfs_signature: string) => papi_clj.core.compile_sfs(sfs_signature);
const run_compiled_sfs = (compiled_sfs: any, spec: any, status: any) =>
    papi_clj.core.run_compiled_sfs(compiled_sfs, spec, status);

export class SFSCompiler {
    static try_parse_sfs(signature: string, kind_name: string): void {
        try {
            sfs_parser(signature)
        } catch(e) {
            throw new ValidationError([
                new Error(`SFS parsing on kind failed with error: ${e.message}`)
            ], '', '', kind_name, { "signature": signature })
        }
    }

    static try_compile_sfs(signature: string, kind: string): any {
        this.try_parse_sfs(signature, kind)
        return sfs_compiler(signature)
    }

    static run_sfs(compiled_sfs: any, spec: any, status: any): DiffContent[] | null {
        return run_compiled_sfs(compiled_sfs, spec, status)
    }
}
