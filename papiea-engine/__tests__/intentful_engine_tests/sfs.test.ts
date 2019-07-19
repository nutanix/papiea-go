import "jest"

const papi_clj = require("../../papiea-lib-clj/papiea-lib-clj.js").papiea_lib_clj;
const clj_str = (a: any) => papi_clj.core.clj_str(a);
const sfs_parser = (sfs_ast: string) => papi_clj.core.parse_sfs(sfs_ast);
const sfs_optimizer = (sfs_ast: string) => papi_clj.core.optimize_sfs_ast(sfs_ast);
const sfs_compiler = (sfs_signature: string) => papi_clj.core.compile_sfs(sfs_signature);
const run_compiled_sfs = (compiled_sfs: any, spec: any, status: any) =>
    papi_clj.core.run_compiled_sfs(compiled_sfs, spec, status);

describe("SFS Tests", () => {
    test("Simple sfs ast", () => {
        expect(clj_str(sfs_parser('a'))).toEqual('[:S [:simple "a"]]');
    });
    test("Complex sfs ast", () => {
        expect(clj_str(sfs_parser('f1.{id}.[another, props.{id2}.name]'))).toEqual('[:S [:complex [:simple "f1"] [:vector [:change] "id"] [:group [:simple "another"] [:complex [:simple "props"] [:vector [:change] "id2"] [:simple "name"]]]]]');
    });
    test("Non-optimized sfs ast", () => {
        expect(clj_str(sfs_parser('[{a.v},d]'))).toEqual('[:S [:complex [:group [:complex [:vector [:change] "a" "v"]] [:simple "d"]]]]');
    });
    test("Optimized sfs ast", () => {
        expect(clj_str(sfs_optimizer(sfs_parser('[{a.v},d]')))).toEqual('[:S [:papiea/group [:papiea/vector [:change] "a" "v"] [:papiea/simple "d"]]]');
    });
    test("Run the sfs '[a,d]' on spec:{a:1, d:2} status:{a:3, d:4}", () => {
        let sfs = sfs_compiler("[a,d]");
        let r = run_compiled_sfs(sfs, { "a": 1, "d": 2 }, { "a": 3, "d": 4 });
        expect(r).toEqual([ { keys: {}, key: 'a', 'spec-val': [ 1 ], 'status-val': [ 3 ] },
        { keys: {}, key: 'd', 'spec-val': [ 2 ], 'status-val': [ 4 ] } ]);
    });
    test("Run the sfs 'a.{id}.[a,d]' on spec:{a:1, d:2} status:{a:3, d:4}", () => {
        let sfs = sfs_compiler("a.{id}.[a,d]");
        let r = run_compiled_sfs(sfs,
            {
                "a": [{ "id": 1, "a": 1, "d": 2 },
                { "id": 2, "a": 1, "d": 2 }]
            },
            {
                "a": [{ "id": 1, "a": 2, "d": 3 },
                { "id": 2, "a": 1, "d": 3 }]
            });
        expect(r).toEqual([ { keys: { id: 1 },
            key: 'a',
            'spec-val': [ 1 ],
            'status-val': [ 2 ] },
          { keys: { id: 1 },
            key: 'd',
            'spec-val': [ 2 ],
            'status-val': [ 3 ] } ]);
    });
})