import { kind_client } from "../src/entity_client"
import { KindBuilder, ProviderBuilder } from "../../papiea-engine/__tests__/test_data_factory"
import axios from "axios"
import https = require('https')
import { IntentfulBehaviour, IntentfulStatus } from "papiea-core"
import { readFileSync } from "fs"
import { resolve } from "path"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';
const httpsAgent = new https.Agent({
    ca: readFileSync(resolve(__dirname, '../certs/ca.crt'))
})

const providerApi = axios.create(
    {
        baseURL: `https://localhost:${ serverPort }/provider/`,
        timeout: 1000,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ adminKey }`
        },
        httpsAgent
    }
);

describe("Entity API tests", () => {
    const providerPrefix = "location_provider_iter_test";
    const providerVersion = "0.0.3";
    let kind_name: string
    const kind = new KindBuilder(IntentfulBehaviour.Differ).build()

    beforeAll(async () => {
        const provider = new ProviderBuilder(providerPrefix).withVersion(providerVersion).withOAuth2Description().withKinds([kind]).build();
        kind_name = provider.kinds[0].name;
        await providerApi.post('/', provider);
    });

    afterAll(async () => {
        await providerApi.delete(`${providerPrefix}/${providerVersion}`);
    });

    test("Update should return entity watcher", async () => {
        expect.assertions(1)
        const location_client = kind_client("https://localhost:3000", providerPrefix, kind_name, providerVersion, '', httpsAgent)
        const entity = await location_client.create({spec: {x: 10, y: 10}})
        const watcher = await location_client.update(entity.metadata, {x: 12, y: 10})
        expect(watcher!.status).toEqual(IntentfulStatus.Active)
        await location_client.delete(entity.metadata)
        location_client.close()
    })
})
