import { DescriptionBuilder, KindBuilder, ProviderBuilder } from "../test_data_factory"
import {
    Intentful_Execution_Strategy,
    IntentfulBehaviour,
    IntentfulStatus,
    IntentWatcher,
    Metadata,
    Provider
} from "papiea-core"
import { LoggerFactory } from 'papiea-backend-utils';
import axios from "axios"
import { MongoConnection } from "../../src/databases/mongo"
import { IntentWatcher_DB } from "../../src/databases/intent_watcher_db_interface"

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string,
        MONGO_DB: string,
        MONGO_URL: string,
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

const providerApiAdmin = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

describe("Intent Watcher tests", () => {

    const locationDataDescription = new DescriptionBuilder().build()
    const signatures = [{
        signature: "x",
        name: "test",
        argument: {},
        result: {},
        execution_strategy: Intentful_Execution_Strategy.Basic,
        procedure_callback: "",
        base_callback: ""
    }, {
        signature: "y",
        name: "test",
        argument: {},
        result: {},
        execution_strategy: Intentful_Execution_Strategy.Basic,
        procedure_callback: "",
        base_callback: ""
    }]
    const locationDifferKind = new KindBuilder(IntentfulBehaviour.Differ).withDescription(locationDataDescription).withSignatures(signatures.slice(0, 1)).build()
    const locationDifferKindWithMultipleSignatures = new KindBuilder(IntentfulBehaviour.Differ).withDescription(locationDataDescription).withSignatures(signatures).build()
    const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017';
    const mongoDb = process.env.MONGO_DB || 'papiea';
    const mongoConnection: MongoConnection = new MongoConnection(mongoUrl, mongoDb);
    const intentfulWorkflowTestLogger = LoggerFactory.makeLogger({level: "info"});
    let intentWatcherDb: IntentWatcher_DB
    let createdWatcher: IntentWatcher
    let to_delete_metadata: Metadata
    let provider: Provider

    beforeAll(async () => {
        await mongoConnection.connect();
        intentWatcherDb = await mongoConnection.get_intent_watcher_db(intentfulWorkflowTestLogger)
    });

    afterAll(async () => {
        await mongoConnection.close()
    });

    afterEach(async () => {
        await intentWatcherDb.delete_watcher(createdWatcher.uuid)
        await entityApi.delete(`${provider.prefix}/${provider.version}/${to_delete_metadata.kind}/${to_delete_metadata.uuid}`)
        await providerApiAdmin.delete(`${provider.prefix}/${provider.version}`)
    })

    test("Intent watcher created through updating the spec", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        const { data: { watcher } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 11
            },
            metadata: {
                spec_version: 1
            }
        })
        expect(watcher.status).toEqual(IntentfulStatus.Pending)
        expect(watcher.diffs[0].diff_fields[0]["spec"][0]).toEqual(20)
        expect(watcher.diffs[0].diff_fields[0]["status"][0]).toEqual(null)
        createdWatcher = watcher
    })

    test("Intent watcher created through updating the spec with multiple diffs", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKindWithMultipleSignatures])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        await entityApi.get(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`)
        const { data: { watcher } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 110
            },
            metadata: {
                spec_version: 1
            }
        })
        expect(watcher.status).toEqual(IntentfulStatus.Pending)
        expect(watcher.diffs[0].diff_fields[0]["spec"][0]).toEqual(20)
        expect(watcher.diffs[1].diff_fields[0].spec[0]).toEqual(110)
        expect(watcher.diffs[0].diff_fields[0]["status"][0]).toEqual(null)
        expect(watcher.diffs[1].diff_fields[0]["status"][0]).toEqual(null)
        createdWatcher = watcher
    })

    test("Intent watcher created through updating the spec and queried via API", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        const { data: { watcher } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 11
            },
            metadata: {
                spec_version: 1
            }
        })

        const result = await entityApi.get(`/intent_watcher/${ watcher.uuid }`)
        expect(result.data.status).toEqual(IntentfulStatus.Pending)
        expect(result.data.diffs).toBeUndefined()
        createdWatcher = watcher
    })

    test("Intent watcher created through updating the spec and queried as list via API", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        const { data: { watcher } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 11
            },
            metadata: {
                spec_version: 1
            }
        })

        const result = await entityApi.get(`/intent_watcher`)
        expect(result.data.results.length).toBeGreaterThanOrEqual(1)
        createdWatcher = watcher
    })

    test("Intent watcher created through updating the spec and queried as list via POST API", async () => {
        expect.hasAssertions()
        provider = new ProviderBuilder()
            .withVersion("0.1.0")
            .withKinds([locationDifferKind])
            .build()
        await providerApiAdmin.post('/', provider);
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        to_delete_metadata = metadata
        const { data: { watcher } } = await entityApi.put(`/${ provider.prefix }/${ provider.version }/${ locationDifferKind.name }/${ metadata.uuid }`, {
            spec: {
                x: 20,
                y: 11
            },
            metadata: {
                spec_version: 1
            }
        })

        const result = await entityApi.post(`/intent_watcher/filter`)
        expect(result.data.results.length).toBeGreaterThanOrEqual(1)
        createdWatcher = watcher
    })
})
