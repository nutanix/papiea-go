import { getLocationDataDescription } from "../test_data_factory";
import axios from "axios";
import { ProviderSdk } from "papiea-sdk";

declare var process: {
    env: {
        SERVER_PORT: string,
        ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.ADMIN_S2S_KEY || '';
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

describe("Pagination tests", () => {
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
        jest.setTimeout(5000);
        await axios.delete(`http://127.0.0.1:${serverPort}/provider/${providerPrefix}/${providerVersion}`);
    });

    let uuids: string[] = [];
    test("Create multiple entities", async () => {
        expect.assertions(1);
        const entityPromises: Promise<any>[] = [];
        for (let i = 0; i < 70; i++) {
            entityPromises.push(entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            }));
        }
        const entityResponses: any[] = await Promise.all(entityPromises);
        uuids = entityResponses.map(entityResp => entityResp.data.metadata.uuid);
        expect(entityResponses.length).toBe(70);
    }, 5000);

    test("Pagination test", async () => {
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBe(30);
        expect(res.data.entity_count).toBe(70);
    });

    test("Pagination test with limit", async () => {
        expect.assertions(2);
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter?limit=10`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBe(10);
        expect(res.data.entity_count).toBe(70);
    });

    test("Pagination test with offset", async () => {
        expect.assertions(2);
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter?offset=30`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBe(30);
        expect(res.data.entity_count).toBe(70);
    });

    test("Pagination test with limit and offset", async () => {
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter?offset=50&limit=40`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBe(20);
        expect(res.data.entity_count).toBe(70);
    });

    test("Pagination limit should be positive", async () => {
        expect.assertions(1);
        try {
            await entityApi.post(`${providerPrefix}/${providerVersion}/${kind_name}/filter?limit=-1`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
        } catch (e) {
            expect(e.response.data.error.errors[0].message).toBe("Limit should not be less or equal to zero");
        }
    });

    test("Pagination offset should be positive", async () => {
        expect.assertions(1);
        try {
            await entityApi.post(`${providerPrefix}/${providerVersion}/${kind_name}/filter?offset=-1`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
        } catch (e) {
            expect(e.response.data.error.errors[0].message).toBe("Offset should not be less or equal to zero");
        }
    });

    test("Pagination test with offset equal to zero", async () => {
        expect.assertions(1);
        try {
            await entityApi.post(`${providerPrefix}/${providerVersion}/${kind_name}/filter?offset=0`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
        } catch (e) {
            expect(e.response.data.error.errors[0].message).toBe("Offset should not be less or equal to zero");
        }
    });

    test("Pagination test with limit equal to zero", async () => {
        expect.assertions(1);
        try {
            await entityApi.post(`${providerPrefix}/${providerVersion}/${kind_name}/filter?limit=0`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
        } catch (e) {
            expect(e.response.data.error.errors[0].message).toBe("Limit should not be less or equal to zero");
        }
    });

    test("Delete multiple entities", async () => {
        expect.assertions(1);
        const deletePromises: Promise<any>[] = [];
        uuids.forEach(uuid => {
            deletePromises.push(entityApi.delete(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ uuid }`));
        });
        await Promise.all(deletePromises);
        let res = await entityApi.post(`${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        expect(res.data.results.length).toBe(0);
    })

});