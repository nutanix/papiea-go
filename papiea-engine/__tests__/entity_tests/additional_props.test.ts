import { ProviderBuilder } from "../test_data_factory";
import axios from "axios";
import { Metadata, Spec } from "papiea-core";
const https = require('https')

const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';

const entityApi = axios.create({
    baseURL: `https://127.0.0.1:${serverPort}/services`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' },
    httpsAgent: new https.Agent({  
        rejectUnauthorized: false
    })
});

const providerApi = axios.create({
    baseURL: `https://127.0.0.1:${serverPort}/provider/`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    },
    httpsAgent: new https.Agent({  
        rejectUnauthorized: false
    })
});

describe("Provider with additional props tests", () => {
    const providerPrefix = "test";
    const providerVersion = "0.1.0";
    let kind_name: string

    beforeAll(async () => {
        const provider = new ProviderBuilder(providerPrefix).withVersion(providerVersion).withKinds().withAllowExtraProps(true).build();
        kind_name = provider.kinds[0].name;
        await providerApi.post('/', provider);
    });

    let entity_metadata: Metadata;
    let entity_spec: Spec;

    afterAll(async () => {
        await entityApi.delete(`/${ providerPrefix }/${ providerVersion }/${ kind_name }/${ entity_metadata.uuid }`);
        await providerApi.delete(`${providerPrefix}/${providerVersion}`);
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