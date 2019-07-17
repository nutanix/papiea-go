import "jest"
import axios from "axios"
import { loadYaml, ProviderBuilder } from "./test_data_factory";
import { Provider } from "papiea-core";

declare var process: {
    env: {
        SERVER_PORT: string,
        ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.ADMIN_S2S_KEY || '';

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider/`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${ serverPort }/services`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Provider API tests", () => {
    const providerPrefix = "test_provider";
    const providerVersion = "0.1.0";

    test("Non-existent route", done => {
        providerApi.delete(`/abc`).then(() => done.fail()).catch(() => done());
    });

    test("Register provider", done => {
        const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [], procedures: {}, extension_structure: {} };
        providerApi.post('/', provider).then(() => done()).catch(done.fail);
    });

    test("Register malformed provider", done => {
        providerApi.post('/', {}).then(() => done.fail()).catch(() => done());
    });
    test("Get provider", async () => {
        const res = await providerApi.get(`/${ providerPrefix }/${ providerVersion }`);
        expect(res.data.kinds).not.toBeUndefined();
    });

    test("Get multiple providers", async () => {
        const version1 = "1.0.0";
        const provider1: Provider = { prefix: providerPrefix, version: version1, kinds: [], procedures: {}, extension_structure: {} };
        await providerApi.post('/', provider1);
        const version2 = "2.0.0";
        const provider2: Provider = { prefix: providerPrefix, version: version2, kinds: [], procedures: {}, extension_structure: {} };
        await providerApi.post('/', provider2);
        const res = await providerApi.get(`/${providerPrefix}`);
        expect(res.data.length).toBeGreaterThanOrEqual(2);
        await providerApi.delete(`/${providerPrefix}/${version1}`);
        await providerApi.delete(`/${providerPrefix}/${version2}`);
    });

    test("Unregister provider", done => {
        providerApi.delete(`/${providerPrefix}/${providerVersion}`).then(() => done()).catch(done.fail);
    });

    test("Unregister non-existend provider", done => {
        providerApi.delete(`/${providerPrefix}/${providerVersion}`).then(() => done.fail()).catch(() => done());
    });

    test("Unregister never existed provider", done => {
        providerApi.delete(`/123/123`).then(() => done.fail()).catch(() => done());
    });

    test("Update status", async () => {
        const provider: Provider = new ProviderBuilder().withVersion("0.1.0").withKinds().build();
        await providerApi.post('/', provider);
        const kind_name = provider.kinds[0].name;
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${provider.version}/${ kind_name }`, {
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

        const res = await entityApi.get(`/${ provider.prefix }/${provider.version}/${ kind_name }/${ metadata.uuid }`);
        expect(res.data.status).toEqual(newStatus);
    });

    test("Update status with malformed status should fail validation", async () => {
        expect.hasAssertions();
        const provider: Provider = new ProviderBuilder().withVersion("0.1.0").withKinds().build();
        await providerApi.post('/', provider);
        const kind_name = provider.kinds[0].name;
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${provider.version}/${ kind_name }`, {
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
        } catch (err) {
            expect(err).toBeDefined();
        }
    });

    test("Update policy", async () => {
        expect.hasAssertions();
        const provider: Provider = new ProviderBuilder().withVersion("0.1.0").withKinds().build();
        await providerApi.post('/', provider);

        const originalPolicy = "g, admin, admin_group";
        await providerApi.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: originalPolicy
        });
        const { data: { policy } } = await providerApi.get(`/${ provider.prefix }/${ provider.version }`);
        expect(policy).toEqual(originalPolicy);
    });

    test("Update status with partial status definition", async () => {
        expect.hasAssertions();
        const provider: Provider = new ProviderBuilder().withVersion("0.1.0").withKinds().build();
        await providerApi.post('/', provider);
        const kind_name = provider.kinds[0].name;
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });

        const newStatus = { y: 20, z: 111 };
        await providerApi.patch('/update_status', {
            context: "some context",
            entity_ref: {
                uuid: metadata.uuid,
                kind: kind_name
            },
            status: newStatus
        });

        const res = await entityApi.get(`/${ provider.prefix }/${ provider.version }/${ kind_name }/${ metadata.uuid }`);
        expect(res.data.status.x).toEqual(10);
        expect(res.data.status.y).toEqual(20);
        expect(res.data.status.z).toEqual(111);
    });

    test("Register provider with extension structure", done => {
        const extension_desc = loadYaml("./metadata_extension.yml");
        const provider: Provider = { prefix: providerPrefix, version: providerVersion, kinds: [], procedures: {}, extension_structure: extension_desc };
        providerApi.post('/', provider).then().catch(done.fail);
        providerApi.delete(`/${ providerPrefix }/${ providerVersion }`).then(() => done()).catch(done.fail);
    });
});