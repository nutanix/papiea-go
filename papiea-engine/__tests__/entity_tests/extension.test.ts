import { getLocationDataDescription, getMetadataDescription } from "../test_data_factory";
import axios from "axios";
import { ProviderSdk } from "papiea-sdk";
import { Metadata, Spec } from "papiea-core";

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

describe("Entity API with metadata extension tests", () => {
    const providerPrefix = "test";
    const providerVersion = "0.1.0";
    const locationDataDescription = getLocationDataDescription();
    const metadata_ext_description = getMetadataDescription();
    const kind_name = Object.keys(locationDataDescription)[0];
    const owner_name = "test@owner.com";
    const tenant_id = "sample_id";

    let entity_metadata: Metadata;
    let entity_spec: Spec;

    beforeAll(async () => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        sdk.new_kind(locationDataDescription);
        sdk.version(providerVersion);
        sdk.prefix(providerPrefix);
        sdk.metadata_extension(metadata_ext_description);
        await sdk.register();
    });

    afterAll(async () => {
        await axios.delete(`http://127.0.0.1:${serverPort}/provider/${providerPrefix}/${providerVersion}`);
    });

    test("Create entity with missing metadata extension should fail validation", async () => {
        expect.hasAssertions();
        try {
            await entityApi.post(`/${providerPrefix}/${providerVersion}/${kind_name}`, {
                spec: {
                    x: 100,
                    y: 11
                }
            });
        } catch (err) {
            const res = err.response;
            expect(res.status).toEqual(400);
            expect(res.data.error.errors.length).toEqual(1);

        }
    });

    test("Create entity with metadata extension", async () => {
        expect.assertions(2);
        const { data: { metadata, spec } } = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                x: 100,
                y: 11
            },
            metadata: {
                extension: {
                    "owner": owner_name,
                    "tenant_id": tenant_id
                }
            }
        });
        entity_metadata = metadata;
        entity_spec = spec;
        expect(spec).toBeDefined();
        expect(metadata).toBeDefined();
    });

    test("Get spec-only entity with extension", async () => {
        expect.assertions(2);
        const res = await entityApi.get(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity_metadata.uuid }`);
        expect(res.data.spec).toEqual(entity_spec);
        expect(res.data.status).toEqual(entity_spec);
    });

    test("Create entity with non-valid metadata extension", async () => {
        expect.assertions(2);
        try {
            await entityApi.post(`/${providerPrefix}/${providerVersion}/${kind_name}`, {
                spec: {
                    x: 100,
                    y: 11
                },
                metadata: {
                    extension: {
                        "owner": owner_name,
                        "tenant_id": 123
                    }
                }
            });
        } catch (err) {
            const res = err.response;
            expect(res.status).toEqual(400);
            expect(res.data.error.errors.length).toEqual(1);
        }
    });

    test("Filter entity by extension", async () => {
        expect.assertions(1);
        const res = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/filter`, {
            metadata: {
                "extension.owner": owner_name,
                "extension.tenant_id": tenant_id
            }
        });
        expect(res.data.results.length).toBe(1);
    });

    test("Create entity with no metadata extension should display a friendly error", async () => {
        expect.assertions(3);
        try {
            await entityApi.post(`/${providerPrefix}/${providerVersion}/${kind_name}`, {
                spec: {
                    x: 100,
                    y: 11
                },
            });
        } catch (err) {
            const res = err.response;
            expect(res.status).toEqual(400);
            expect(res.data.error.errors.length).toEqual(1);
            expect(res.data.error.errors[0].message).toEqual("Metadata extension is not specified");
        }
    });
});