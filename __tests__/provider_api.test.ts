import "jest"
import axios from "axios"
import { Provider } from "../src/papiea";
import { getProviderWithSpecOnlyEnitityKindNoOperations } from "./test_data_factory";

declare var process: {
    env: {
        SERVER_PORT: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${ serverPort }/provider/`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${ serverPort }/entity`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Provider API tests", () => {
    const providerPrefix = "test_provider";
    const providerVersion = "0.1.0";

    beforeEach(() => {
        jest.setTimeout(10000);
    });

    test("Non-existent route", done => {
        providerApi.delete(`/abc`).then(() => done.fail()).catch(() => done());
    });

    test("Register provider", done => {
        const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [] };
        providerApi.post('/', provider).then(() => done()).catch(done.fail);
    });

    test("Register malformed provider", done => {
        providerApi.post('/', {}).then(() => done.fail()).catch(() => done());
    });
    test("Get provider", async done => {
        try {
            const res = await providerApi.get(`/${ providerPrefix }/${ providerVersion }`);
            expect(res.data.kinds).not.toBeUndefined();
            done();
        } catch (e) {
            done.fail(e)
        }
    });

    test("Get multiple providers", async done => {
        const version = "1.0.0";
        const provider: Provider = { prefix: providerPrefix, version: version, kinds: [] };
        providerApi.post('/', provider).then().catch(done.fail);
        try {
            const res = await providerApi.get(`/${ providerPrefix }`);
            expect(res.data.length).toBeGreaterThanOrEqual(2);
            providerApi.delete(`/${ providerPrefix }/${ version }`).then(() => done()).catch(done.fail);
            done();
        } catch (e) {
            done.fail(e)
        }
    });

    // TODO(adolgarev): there is no API to list providers

    test("Unregister provider", done => {
        providerApi.delete(`/${ providerPrefix }/${ providerVersion }`).then(() => done()).catch(done.fail);
    });

    test("Unregister non-existend provider", done => {
        providerApi.delete(`/${ providerPrefix }/${ providerVersion }`).then(() => done.fail()).catch(() => done());
    });

    test("Unregister never existed provider", done => {
        providerApi.delete(`/123/123`).then(() => done.fail()).catch(() => done());
    });

    test("Update status", async done => {
        try {
            const provider: Provider = getProviderWithSpecOnlyEnitityKindNoOperations();
            await providerApi.post('/', provider);
            const kind_name = provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });

            const newStatus = { x: 10, y: 20, z: 111 };
            await providerApi.post('/update_status', {
                context: "some context",
                entity_ref: {
                    uuid: metadata.uuid,
                    kind: kind_name
                },
                status: newStatus
            });

            const res = await entityApi.get(`/${ provider.prefix }/${ kind_name }/${ metadata.uuid }`);
            expect(res.data.status).toEqual(newStatus);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Update status with malformed status should fail validation", async done => {
        const provider: Provider = getProviderWithSpecOnlyEnitityKindNoOperations();
        await providerApi.post('/', provider);
        const kind_name = provider.kinds[0].name;
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });

        try {
            await providerApi.post('/update_status', {
                context: "some context",
                entity_ref: {
                    uuid: metadata.uuid,
                    kind: kind_name
                },
                status: { x: 11, y: "Totally not a number" }
            });
            done.fail();
        } catch (err) {
            done();
        }
    });
});