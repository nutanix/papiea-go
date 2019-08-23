import axios from "axios";
import { ProviderSdk } from "papiea-sdk";
import { Metadata, Spec } from "papiea-core";
import { getLocationDataDescription } from "../test_data_factory";
import { stringify } from "querystring"
import uuid = require("uuid");

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';
const papieaUrl = `http://127.0.0.1:${serverPort}`;

const server_config = {
    host: "127.0.0.1",
    port: 9000
};

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Entity API tests", () => {
    const providerPrefix = "test";
    const providerVersion = "0.1.0";
    const locationDataDescription = getLocationDataDescription();
    const kind_name = Object.keys(locationDataDescription)[0];
    beforeAll(async () => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        sdk.new_kind(locationDataDescription);
        sdk.version(providerVersion);
        sdk.prefix(providerPrefix);
        await sdk.register();
    });

    afterAll(async () => {
        await axios.delete(`http://127.0.0.1:${serverPort}/provider/${providerPrefix}/${providerVersion}`);
    });

    let entity_metadata: Metadata;
    let entity_spec: Spec;
    test("Create spec-only entity", async () => {
        expect.assertions(3);
        const { data: { metadata, spec } } = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        expect(metadata).not.toBeUndefined();
        expect(metadata.spec_version).toEqual(1);
        expect(spec).not.toBeUndefined();
        entity_metadata = metadata;
        entity_spec = spec;
    });

    test("Create entity with malformed spec should fail", async () => {
        expect.assertions(2);
        try {
            await entityApi.post(`/${providerPrefix}/${providerVersion}/${kind_name}`, {
                spec: {
                    x: "Totally not a number",
                    y: 11
                }
            });
        } catch (err) {
            const res = err.response;
            expect(res.status).toEqual(400);
            expect(res.data.error.errors.length).toEqual(1);
        }
    });

    test("Get spec-only entity", async () => {
        expect.assertions(2);
        const res = await entityApi.get(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity_metadata.uuid }`);
        expect(res.data.spec).toEqual(entity_spec);
        expect(res.data.status).toEqual(entity_spec);
    });

    test("Get non-existent spec-only entity should fail", async () => {
        expect.assertions(2);
        try {
            await entityApi.get(`/${ providerPrefix }/${providerVersion}/${ kind_name }/${ uuid() }`);
        } catch (e) {
            expect(e.response.status).toBe(404);
            expect(e.response.data).not.toBeUndefined();

        }
    });

    test("Filter entity", async () => {
        expect.hasAssertions();
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                y: 11,
                z: 111
            }
        });
        expect(res.data.results.length).toBe(0);
    });

    test("Filter spec only entity should contain status", async () => {
        expect.hasAssertions();
        const res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        const entity = res.data.results[0];
        expect(entity.spec.x).toEqual(10);
        expect(entity.status).toEqual(entity.spec);
    });

    test("Filter entity by status", async () => {
        expect.hasAssertions();
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            status: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res.data.results.forEach((entity: any) => {
            expect(entity.status.x).toEqual(10);
            expect(entity.status.y).toEqual(11);
        });
        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            status: {
                x: 10
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res.data.results.forEach((entity: any) => {
            expect(entity.status.x).toEqual(10);
        });
        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            status: {
                x: 10,
                z: 1111
            }
        });
        expect(res.data.results.length).toBe(0);
    });

    test("Filter entity by spec and status", async () => {
        expect.hasAssertions();
        const res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                y: 11
            },
            status: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res.data.results.forEach((entity: any) => {
            expect(entity.spec.x).toEqual(10);
            expect(entity.spec.y).toEqual(11);
            expect(entity.status.x).toEqual(10);
            expect(entity.status.y).toEqual(11);
        });
    });

    // TODO: rewrite it with fast check
    test("Filter entity by nested fields", async () => {
        await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11,
                v: {
                    e: 12,
                    d: 13
                }
            }
        });
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                "v.e": 12
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res.data.results.forEach((entity: any) => {
            expect(entity.spec.x).toEqual(10);
            expect(entity.spec.v.e).toEqual(12);
        });
        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                v: {
                    e: 12,
                    d: 13
                }
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res.data.results.forEach((entity: any) => {
            expect(entity.spec.x).toEqual(10);
            expect(entity.spec.v.e).toEqual(12);
        });
        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                v: {
                    e: 12
                }
            }
        });
        expect(res.data.results.length).toBe(0);

        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            status: {
                x: 10,
                "v.e": 12
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res.data.results.forEach((entity: any) => {
            expect(entity.status.x).toEqual(10);
            expect(entity.status.v.e).toEqual(12);
        });
        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            status: {
                x: 10,
                v: {
                    e: 12,
                    d: 13
                },
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res.data.results.forEach((entity: any) => {
            expect(entity.status.x).toEqual(10);
            expect(entity.status.v.e).toEqual(12);
        });
        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            status: {
                x: 10,
                v: {
                    e: 12
                }
            }
        });
        expect(res.data.results.length).toBe(0);

        res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                "v.e": 12
            },
            status: {
                x: 10,
                "v.e": 12
            }
        });
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
        res.data.results.forEach((entity: any) => {
            expect(entity.spec.x).toEqual(10);
            expect(entity.spec.v.e).toEqual(12);
            expect(entity.status.x).toEqual(10);
            expect(entity.status.v.e).toEqual(12);
        });
    });

    test("Filter entity with query params", async () => {
        expect.assertions(1);
        const spec = {
            x: 10,
            y: 11
        };
        const spec_query = {
            spec: JSON.stringify(spec)
        };
        const res = await entityApi.get(`${ providerPrefix }/${ providerVersion }/${ kind_name }?${ stringify(spec_query) }`);
        expect(res.data.results.length).toBeGreaterThanOrEqual(1);
    });

    test("Update spec-only entity spec", async () => {
        expect.assertions(3);
        let res = await entityApi.put(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity_metadata.uuid }`, {
            spec: {
                x: 20,
                y: 21
            },
            metadata: {
                spec_version: 1
            }
        });
        expect(res.data.spec.x).toEqual(20);
        res = await entityApi.get(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity_metadata.uuid }`);
        expect(res.data.spec.x).toEqual(20);
        expect(res.data.status.x).toEqual(20);
    });

    test("Update entity with malformed spec should fail", async () => {
        expect.assertions(3);
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${providerVersion}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
            expect(metadata).not.toBeUndefined();
            await entityApi.put(`/${providerPrefix}/${providerVersion}/${kind_name}/${metadata.uuid}`, {
                spec: {
                    x: "Totally not a number",
                    y: 21
                },
                metadata: {
                    spec_version: 1
                }
            });
        } catch (err) {
            const res = err.response;
            expect(res.status).toEqual(400);
            expect(res.data.error.errors.length).toEqual(1);
        }
    });

    test("Create entity with non valid uuid should be an error", async () => {
        expect.assertions(1);
        try {
            const { data: { metadata, spec } } = await entityApi.post(`/${providerPrefix}/${providerVersion}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: "123"
                }
            });
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    test("Create entity and provide uuid", async () => {
        expect.assertions(2);
        const entity_uuid = uuid();
        const { data: { metadata, spec } } = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11
            },
            metadata: {
                uuid: entity_uuid
            }
        });
        expect(metadata.uuid).toEqual(entity_uuid);
        const res = await entityApi.get(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity_uuid }`);
        expect(res.data.metadata.uuid).toEqual(entity_uuid);
    });

    test("Delete entity", async () => {
        expect.assertions(1);
        await entityApi.delete(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity_metadata.uuid }`);
        try {
            await entityApi.get(`/${providerPrefix}/${providerVersion}/${kind_name}/${entity_metadata.uuid}`);
        } catch (e) {
            expect(e).toBeDefined();
        }
    });

    test("Filter deleted entity", async () => {
        expect.hasAssertions();
        const { data: { metadata, spec } } = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        await entityApi.delete(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ metadata.uuid }`);
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            metadata: {
                uuid: metadata.uuid
            }
        });
        expect(res.data.results.length).toBe(0);
        for (const deleted_at of ["papiea_one_hour_ago", "papiea_one_day_ago"]) {
            let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
                metadata: {
                    uuid: metadata.uuid,
                    deleted_at: deleted_at
                }
            });
            expect(res.data.results.length).toBe(1);
            expect(res.data.results[0].spec).toEqual(spec);
            expect(res.data.results[0].status).toEqual(spec);
        }
    });
});