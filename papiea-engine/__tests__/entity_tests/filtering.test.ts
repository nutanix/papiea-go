import { ProviderBuilder } from "../test_data_factory";
import axios from "axios";
import { plural } from "pluralize"
import { IntentfulBehaviour, SpecOnlyEntityKind } from "papiea-core"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider/`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

describe("Filtering tests", () => {
    const providerPrefix = "test_filtering";
    const providerVersion = "0.1.0";
    const kind_name: string = "F"
    const kind_structure = {
        F: {
            type: "object",
            "x-papiea-entity": "spec-only",
            properties: {
                a: {
                    type: "string"
                },
                b: {
                    type: "object",
                    properties: {
                        x: {
                            type: "string"
                        },
                        y: {
                            type: "string"
                        }
                    }
                }
            }
        }
    }
    const kind: SpecOnlyEntityKind = {
        name: kind_name,
        name_plural: plural(kind_name),
        kind_structure: kind_structure,
        intentful_signatures: [],
        dependency_tree: new Map(),
        kind_procedures: {},
        entity_procedures: {},
        differ: undefined,
        intentful_behaviour: IntentfulBehaviour.SpecOnly
    };

    beforeAll(async () => {
        const provider = new ProviderBuilder(providerPrefix).withVersion(providerVersion).withKinds([kind]).build();
        await providerApi.post('/', provider);
    });

    afterAll(async () => {
        jest.setTimeout(5000);
        await providerApi.delete(`${providerPrefix}/${providerVersion}`);
    });

    let uuids: string[] = [];
    test("Filter with direct and reverse order of nested spec fields", async () => {
        expect.assertions(2);
        const entity = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                a: "a",
                b: {
                    x: "x",
                    y: "y"
                }
            }
        });
        try {
            let { data: { results } } = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
                spec: {
                    a: "a",
                    b: {
                        x: "x",
                        y: "y"
                    }
                }
            })
            expect(results.length).toEqual(1)
            let swapped_res = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
                spec: {
                    a: "a",
                    b: {
                        y: "y",
                        x: "x"
                    }
                }
            })
            expect(swapped_res.data.results.length).toEqual(1)
        } finally {
            await entityApi.delete(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity.data.metadata.uuid }`)
        }
    }, 5000);

    test("Filter with direct and reverse order of nested status fields", async () => {
        expect.assertions(2);
        const entity = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                a: "a",
                b: {
                    x: "x",
                    y: "y"
                }
            }
        });
        try {
            let { data: { results } } = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
                status: {
                    a: "a",
                    b: {
                        x: "x",
                        y: "y"
                    }
                }
            })
            expect(results.length).toEqual(1)
            let swapped_res = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
                status: {
                    a: "a",
                    b: {
                        y: "y",
                        x: "x"
                    }
                }
            })
            expect(swapped_res.data.results.length).toEqual(1)
        } finally {
            await entityApi.delete(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity.data.metadata.uuid }`)
        }
    }, 5000);

    test("Filter with direct and reverse order of partial nested spec fields", async () => {
        expect.assertions(1);
        const entity = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                a: "a",
                b: {
                    x: "x",
                    y: "y"
                }
            }
        });
        try {
            let { data: { results } } = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
                status: {
                    b: {
                        x: "x",
                    }
                }
            })
            expect(results.length).toEqual(1)
        } finally {
            await entityApi.delete(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity.data.metadata.uuid }`)
        }
    }, 5000);
});