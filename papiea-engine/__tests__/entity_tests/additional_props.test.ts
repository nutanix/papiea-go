import { getLocationDataDescription } from "../test_data_factory";
import axios from "axios";
import { ProviderSdk } from "papiea-sdk/build/provider_sdk/typescript_sdk";
import { Metadata, Spec } from "papiea-core/build/core";

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

describe("Provider with additional props tests", () => {
    const providerPrefix = "test";
    const providerVersion = "0.1.0";
    const locationDataDescription = getLocationDataDescription();
    const kind_name = Object.keys(locationDataDescription)[0];

    beforeAll(async () => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port, true);
        sdk.new_kind(locationDataDescription);
        sdk.version(providerVersion);
        sdk.prefix(providerPrefix);
        await sdk.register();
    });

    let entity_metadata: Metadata;
    let entity_spec: Spec;

    afterAll(async () => {
        await entityApi.delete(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity_metadata.uuid }`);
        await axios.delete(`http://127.0.0.1:${serverPort}/provider/${providerPrefix}/${providerVersion}`);
    });


    test("Create spec-only entity with additional props set to 'true' should succeed", async () => {
        const { data: { metadata, spec } } = await entityApi.post(`/${ providerPrefix }/${ providerVersion }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11,
                z: 100,
                f: "Additional prop"
            }
        });
        entity_metadata = metadata;
        entity_spec = spec;
        expect(metadata).toBeDefined()
        expect(spec).toBeDefined()
    });
});