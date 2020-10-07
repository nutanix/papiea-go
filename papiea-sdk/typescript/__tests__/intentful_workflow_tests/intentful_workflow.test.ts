import { DescriptionBuilder, DescriptionType, } from "../../../../papiea-engine/__tests__/test_data_factory"
import axios from "axios"
import { timeout } from "../../../../papiea-engine/src/utils/utils"
import { IntentfulBehaviour, IntentfulStatus, Metadata, Version } from "papiea-core"
import { ProviderSdk } from "../../src/provider_sdk/typescript_sdk";
import uuid = require("uuid");

declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string,
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';
const papieaUrl = 'http://127.0.0.1:3000';

const server_config = {
    host: "127.0.0.1",
    port: 9000
};

const server_config_2nd_provider = {
    host: "127.0.0.1",
    port: 9011
};

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

const providerApiAdmin = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

describe("Intentful Workflow tests", () => {

    const locationDataDescription = new DescriptionBuilder().withBehaviour(IntentfulBehaviour.Differ).build()
    const locationDataDescriptionDuplicate = new DescriptionBuilder().withBehaviour(IntentfulBehaviour.Differ).build()
    const xFieldStructure = {"type": "array", "items": {"type": "object", "properties": {"ip": {"type": "string"}}}}
    const locationDataDescriptionArraySfs = new DescriptionBuilder(DescriptionType.Location, "Location").withBehaviour(IntentfulBehaviour.Differ).withStatusOnlyField("z").withField("x", xFieldStructure).build()
    let first_provider_prefix: string
    let second_provider_prefix: string
    let provider_version: Version = "0.1.0"
    let first_provider_to_delete_entites: Metadata[] = []
    let second_provider_to_delete_entites: Metadata[] = []

    afterEach(async () => {
        for (let metadata of first_provider_to_delete_entites) {
            await entityApi.delete(`${first_provider_prefix}/${provider_version}/${metadata.kind}/${metadata.uuid}`)
        }
        try {
            for (let metadata of second_provider_to_delete_entites) {
                await entityApi.delete(`${ second_provider_prefix }/${ provider_version }/${ metadata.kind }/${ metadata.uuid }`)
            }
        } catch (e) {
        }
        first_provider_to_delete_entites = []
        second_provider_to_delete_entites = []
        await providerApiAdmin.delete(`${first_provider_prefix}/${provider_version}`)
        try {
            await providerApiAdmin.delete(`${ second_provider_prefix }/${ provider_version }`)
        } catch (e) {
        }
    })

    test("Change single field differ resolver should pass", async () => {
        expect.assertions(2);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            first_provider_prefix = "location_provider_intentful_1"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: entity.metadata.uuid,
                        kind: entity.metadata.kind
                    },
                    status: { x: entity.spec.x }
                })
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { watcher } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 20,
                    y: 11
                },
                metadata: {
                    spec_version: 1

                }
            })
            let retries = 10
            try {
                let watcherApi = sdk.get_intent_watcher_client()
                for (let i = 1; i <= retries; i++) {
                    const intent_watcher = await watcherApi.get(watcher.uuid)
                    if (intent_watcher.status === IntentfulStatus.Completed_Successfully) {
                        expect(intent_watcher.status).toBe(IntentfulStatus.Completed_Successfully)
                        const result = await entityApi.get(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`)
                        expect(result.data.status.x).toEqual(20)
                        return
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Delay to intentful operations should be awaited", async () => {
        expect.assertions(3);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            let times_requested = 0
            first_provider_prefix = "location_provider_intentful_3"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                times_requested++
                if (times_requested === 2) {
                    await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                        context: "some context",
                        entity_ref: {
                            uuid: metadata.uuid,
                            kind: kind_name
                        },
                        status: { x: entity.spec.x }
                    })
                    return {"delay_secs": 2}
                } else {
                    // 12 seconds delay
                    return {"delay_secs": 12}
                }
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { watcher } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 30,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            try {
                await timeout(5000)
                let watcherApi = sdk.get_intent_watcher_client()

                let intent_watcher = await watcherApi.get(watcher.uuid)
                expect(intent_watcher.status).toBe(IntentfulStatus.Active)
                await timeout(3000)
                intent_watcher = await watcherApi.get(watcher.uuid)
                expect(intent_watcher.status).toBe(IntentfulStatus.Active)
                await timeout(15000)
                intent_watcher = await watcherApi.get(watcher.uuid)
                expect(intent_watcher.status).toBe(IntentfulStatus.Completed_Successfully)
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
                expect(e).toBeUndefined()
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Exponential backoff should be activated", async () => {
        expect.assertions(1);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            let times_requested = 0
            first_provider_prefix = "location_provider_exponential_backoff"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                times_requested++
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 30,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            await timeout(18000)
            expect(times_requested).toBeLessThanOrEqual(4)
        } finally {
            sdk.server.close();
        }
    })

    test("Delay of null should be eligible", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            first_provider_prefix = "location_provider_intentful_null_delay"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: metadata.uuid,
                        kind: kind_name
                    },
                    status: { x: entity.spec.x }
                })
                return null
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { watcher } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 30,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            let retries = 10
            try {
                let watcherApi = sdk.get_intent_watcher_client()
                for (let i = 1; i <= retries; i++) {
                    const intent_watcher = await watcherApi.get(watcher.uuid)
                    if (intent_watcher.status === IntentfulStatus.Completed_Successfully) {
                        expect(intent_watcher.status).toBe(IntentfulStatus.Completed_Successfully)
                        const result = await entityApi.get(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`)
                        expect(result.data.status.x).toEqual(30)
                        return
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
                expect(e).toBeUndefined()
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Differ resolver with 2 kinds and shared uuid entities should pass", async () => {
        expect.hasAssertions();
        let test_result = false
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            first_provider_prefix = "location_provider_intentful_1_kinds"
            const first_location = sdk.new_kind(locationDataDescription)
            const second_location = sdk.new_kind(locationDataDescriptionDuplicate)
            sdk.version(provider_version)
            sdk.prefix(first_provider_prefix)
            const intentful_handler = () => {
                return async (ctx: any, entity: any, input: any) => {
                    await providerApiAdmin.patch(`/${ sdk.provider.prefix }/${ sdk.provider.version }/update_status`, {
                        context: "some context",
                        entity_ref: {
                            uuid: entity.metadata.uuid,
                            kind: entity.metadata.kind
                        },
                        status: { x: entity.spec.x }
                    })
                }
            }
            first_location.on("x", intentful_handler())
            second_location.on("x", intentful_handler())
            const on_create_handler = () => {
                return async (ctx: any, entity: any) => {
                    const { metadata, spec } = entity
                    await ctx.update_status(metadata!, spec!)
                }
            }
            first_location.on_create(on_create_handler())
            second_location.on_create(on_create_handler())
            await sdk.register();
            const first_kind_name = sdk.provider.kinds[0].name;
            const second_kind_name = sdk.provider.kinds[1].name;

            const shared_uuid = uuid()

            const first_result = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ first_kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: shared_uuid
                }
            })
            const second_result = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ second_kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: shared_uuid
                }
            })
            first_provider_to_delete_entites.push(first_result.data.metadata)
            first_provider_to_delete_entites.push(second_result.data.metadata)
            await timeout(5000)
            const first_watcher_result = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ first_kind_name }/${ first_result.data.metadata.uuid }`, {
                spec: {
                    x: 20,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            const second_watcher_result = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ second_kind_name }/${ second_result.data.metadata.uuid }`, {
                spec: {
                    x: 20,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            const first_watcher = first_watcher_result.data.watcher
            const second_watcher = second_watcher_result.data.watcher
            const watchers = [first_watcher, second_watcher]
            let retries = 10
            try {
                let watcherApi = sdk.get_intent_watcher_client()
                for (let i = 1; i <= retries; i++) {
                    const promises = watchers.map(watcher => watcherApi.get(watcher.uuid))
                    const results = await Promise.all(promises)
                    if (results.every(intent_watcher => intent_watcher.status === IntentfulStatus.Completed_Successfully)) {
                        const first_res = await entityApi.get(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ first_kind_name }/${ first_result.data.metadata.uuid }`)
                        expect(first_res.data.status.x).toEqual(20)
                        const second_res = await entityApi.get(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ second_kind_name }/${ second_result.data.metadata.uuid }`)
                        expect(second_res.data.status.x).toEqual(20)
                        test_result = true
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${ e }`)
                expect(e).toBeUndefined()
            }
        } finally {
            sdk.server.close();
            expect(test_result).toBeTruthy()
        }
    })

    test("Differ resolver with 2 providers and entities with same uuid should pass", async () => {
        expect.hasAssertions();
        let test_result = false
        const sdk1 = ProviderSdk.create_provider(
            papieaUrl, adminKey, server_config.host, server_config.port);
        const sdk2 = ProviderSdk.create_provider(
            papieaUrl, adminKey, server_config_2nd_provider.host, server_config_2nd_provider.port);
        try {
            first_provider_prefix = "location_provider_intentful_1"
            second_provider_prefix = "2nd_location_provider_intentful_1"
            const first_location = sdk1.new_kind(locationDataDescription);
            const second_location = sdk2.new_kind(locationDataDescription);
            sdk1.version(provider_version);
            sdk1.prefix(first_provider_prefix);
            sdk2.prefix(second_provider_prefix);
            sdk2.version(provider_version);
            const intentful_handler = (sdk: ProviderSdk) => {
                return async (ctx: any, entity: any, input: any) => {
                    await providerApiAdmin.patch(`/${ sdk.provider.prefix }/${ sdk.provider.version }/update_status`, {
                        context: "some context",
                        entity_ref: {
                            uuid: entity.metadata.uuid,
                            kind: entity.metadata.kind
                        },
                        status: { x: entity.spec.x }
                    })
                }
            }
            first_location.on("x", intentful_handler(sdk1))
            second_location.on("x", intentful_handler(sdk2))
            const on_create_handler = () => {
                return async (ctx: any, entity: any) => {
                    const { metadata, spec } = entity
                    await ctx.update_status(metadata!, spec!)
                }
            }
            first_location.on_create(on_create_handler())
            second_location.on_create(on_create_handler())
            await sdk1.register();
            await sdk2.register();
            const first_kind_name = sdk1.provider.kinds[0].name;
            const second_kind_name = sdk2.provider.kinds[0].name;

            const shared_uuid = uuid()

            const first_result = await entityApi.post(`${ sdk1.entity_url }/${ sdk1.provider.prefix }/${ sdk1.provider.version }/${ first_kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: shared_uuid
                }
            })
            first_provider_to_delete_entites.push(first_result.data.metadata)
            const second_result = await entityApi.post(`${ sdk2.entity_url }/${ sdk2.provider.prefix }/${ sdk2.provider.version }/${ second_kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: shared_uuid
                }
            })
            second_provider_to_delete_entites.push(second_result.data.metadata)
            await timeout(5000)

            const first_watcher_result = await entityApi.put(
                `/${ sdk1.provider.prefix }/${ sdk1.provider.version }/${ first_kind_name }/${ first_result.data.metadata.uuid }`, {
                    spec: {
                        x: 20,
                        y: 11
                    },
                    metadata: {
                        spec_version: 1
                    }
                })

            const second_watcher_result = await entityApi.put(
                `/${ sdk2.provider.prefix }/${ sdk2.provider.version }/${ second_kind_name }/${ second_result.data.metadata.uuid }`, {
                    spec: {
                        x: 20,
                        y: 11
                    },
                    metadata: {
                        spec_version: 1
                    }
                })
            const first_watcher = first_watcher_result.data.watcher
            const second_watcher = second_watcher_result.data.watcher
            const watchers = [first_watcher, second_watcher]
            let retries = 10

            try {
                let watcherApi = sdk1.get_intent_watcher_client()
                for (let i = 1; i <= retries; i++) {
                    const promises = watchers.map(watcher => watcherApi.get(watcher.uuid))
                    const results = await Promise.all(promises)
                    if (results.every(intent_watcher => intent_watcher.status === IntentfulStatus.Completed_Successfully)) {
                        const first_res = await entityApi.get(`/${ sdk1.provider.prefix }/${ sdk1.provider.version }/${ first_kind_name }/${ first_result.data.metadata.uuid }`)
                        expect(first_res.data.status.x).toEqual(20)
                        const second_res = await entityApi.get(`/${ sdk2.provider.prefix }/${ sdk2.provider.version }/${ second_kind_name }/${ second_result.data.metadata.uuid }`)
                        expect(second_res.data.status.x).toEqual(20)
                        test_result = true
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${ e }`)
                expect(e).toBeUndefined()
            }
        } catch (e) {
            console.log(`Error: ${e}`)
        } finally {
            sdk1.server.close();
            sdk2.server.close();
            expect(test_result).toBeTruthy()
        }
    })

    test("Differ resolver with 2 providers, same kinds and entities with same uuid should pass", async () => {
        expect.hasAssertions();
        let test_result = false
        const sdk1 = ProviderSdk.create_provider(
            papieaUrl, adminKey, server_config.host, server_config.port);
        const sdk2 = ProviderSdk.create_provider(
            papieaUrl, adminKey, server_config_2nd_provider.host, server_config_2nd_provider.port);
        try {
            first_provider_prefix = "location_provider_intentful_1_same_kind"
            second_provider_prefix = "2nd_location_provider_intentful_1_same_kind"
            const first_location = sdk1.new_kind(JSON.parse(JSON.stringify(locationDataDescription)));
            const second_location = sdk2.new_kind(JSON.parse(JSON.stringify(locationDataDescription)));
            sdk1.version(provider_version);
            sdk1.prefix(first_provider_prefix);
            sdk2.prefix(second_provider_prefix);
            sdk2.version(provider_version);
            const intentful_handler = (sdk: ProviderSdk) => {
                return async (ctx: any, entity: any, input: any) => {
                    await providerApiAdmin.patch(`/${ sdk.provider.prefix }/${ sdk.provider.version }/update_status`, {
                        context: "some context",
                        entity_ref: {
                            uuid: entity.metadata.uuid,
                            kind: entity.metadata.kind
                        },
                        status: { x: entity.spec.x }
                    })
                }
            }
            first_location.on("x", intentful_handler(sdk1))
            second_location.on("x", intentful_handler(sdk2))
            const on_create_handler = () => {
                return async (ctx: any, entity: any) => {
                    const { metadata, spec } = entity
                    await ctx.update_status(metadata!, spec!)
                }
            }
            first_location.on_create(on_create_handler())
            second_location.on_create(on_create_handler())
            await sdk1.register();
            await sdk2.register();
            const first_kind_name = sdk1.provider.kinds[0].name;
            const second_kind_name = sdk2.provider.kinds[0].name;

            const shared_uuid = uuid()

            const first_result = await entityApi.post(`${ sdk1.entity_url }/${ sdk1.provider.prefix }/${ sdk1.provider.version }/${ first_kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: shared_uuid
                }
            })
            first_provider_to_delete_entites.push(first_result.data.metadata)
            const second_result = await entityApi.post(`${ sdk2.entity_url }/${ sdk2.provider.prefix }/${ sdk2.provider.version }/${ second_kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                },
                metadata: {
                    uuid: shared_uuid
                }
            })
            second_provider_to_delete_entites.push(second_result.data.metadata)
            await timeout(5000)

            const first_watcher_result = await entityApi.put(
                `/${ sdk1.provider.prefix }/${ sdk1.provider.version }/${ first_kind_name }/${ first_result.data.metadata.uuid }`, {
                    spec: {
                        x: 20,
                        y: 11
                    },
                    metadata: {
                        spec_version: 1
                    }
                })

            const second_watcher_result = await entityApi.put(
                `/${ sdk2.provider.prefix }/${ sdk2.provider.version }/${ second_kind_name }/${ second_result.data.metadata.uuid }`, {
                    spec: {
                        x: 20,
                        y: 11
                    },
                    metadata: {
                        spec_version: 1
                    }
                })
            const first_watcher = first_watcher_result.data.watcher
            const second_watcher = second_watcher_result.data.watcher
            const watchers = [first_watcher, second_watcher]
            let retries = 10
            try {
                let watcherApi = sdk1.get_intent_watcher_client()
                for (let i = 1; i <= retries; i++) {
                    const promises = watchers.map(watcher => watcherApi.get(watcher.uuid))
                    const results = await Promise.all(promises)
                    if (results.every(intent_watcher => intent_watcher.status === IntentfulStatus.Completed_Successfully)) {
                        const first_res = await entityApi.get(`/${ sdk1.provider.prefix }/${ sdk1.provider.version }/${ first_kind_name }/${ first_result.data.metadata.uuid }`)
                        expect(first_res.data.status.x).toEqual(20)
                        const second_res = await entityApi.get(`/${ sdk2.provider.prefix }/${ sdk2.provider.version }/${ second_kind_name }/${ second_result.data.metadata.uuid }`)
                        expect(second_res.data.status.x).toEqual(20)
                        test_result = true
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${ e }`)
                expect(e).toBeUndefined()
            }
        } catch (e) {
            console.log(`Error: ${e}`)
        } finally {
            sdk1.server.close();
            sdk2.server.close();
            expect(test_result).toBeTruthy()
        }
    })

    test("Change single field differ resolver should fail because of handler error", async () => {
        expect.assertions(2);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            first_provider_prefix = "location_provider_intentful_2"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                throw new Error("Error in handler")
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 120,
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { watcher } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 25,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            let retries = 10
            try {
                let watcherApi = sdk.get_intent_watcher_client()
                for (let i = 1; i <= retries; i++) {
                    const intent_watcher = await watcherApi.get(watcher.uuid)
                    if (intent_watcher.status === IntentfulStatus.Active && intent_watcher.times_failed > 1) {
                        expect(intent_watcher.times_failed).toBeGreaterThan(1)
                        expect(intent_watcher.last_handler_error).toEqual("Error in handler")
                        return
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Change single field differ resolver should fail because of CAS fail", async () => {
        expect.assertions(1);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            first_provider_prefix = "location_provider_intentful_1"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: metadata.uuid,
                        kind: kind_name
                    },
                    status: { x: entity.spec.x }
                })
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await timeout(5000)
            try {
                await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                    spec: {
                        x: 20,
                        y: 11
                    },
                    metadata: {
                        spec_version: 0
                    }
                })
            } catch (e) {
                expect(e.response.status).toEqual(409)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Two concurrent updates with the same spec version should fail", async () => {
        expect.assertions(1);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            first_provider_prefix = "location_provider_intentful_2_concurrent_cas"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: metadata.uuid,
                        kind: kind_name
                    },
                    status: { x: entity.spec.x }
                })
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await timeout(5000)
            const promises = []
            for (let i = 0; i < 2; i++) {
                promises.push(entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                    spec: {
                        x: 20,
                        y: 11
                    },
                    metadata: {
                        spec_version: 1
                    }
                }))
            }
            try {
                await Promise.all(promises)
            } catch (e) {
                expect(e.response.status).toEqual(409)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Two serial updates with the same spec version should fail", async () => {
        expect.assertions(1);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            first_provider_prefix = "location_provider_intentful_2_concurrent_cas_serial"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: metadata.uuid,
                        kind: kind_name
                    },
                    status: { x: entity.spec.x }
                })
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: 10,
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await timeout(5000)
            await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: 20,
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            await timeout(5000)
            try {
                await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                    spec: {
                        x: 20,
                        y: 11
                    },
                    metadata: {
                        spec_version: 1
                    }
                })
            } catch (e) {
                expect(e.response.status).toEqual(409)
            }
        } finally {
            sdk.server.close();
        }
    })

    test("Change single array sfs field differ resolver should pass", async () => {
        expect.assertions(2);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            first_provider_prefix = "location_provider_intentful_4"
            const location = sdk.new_kind(locationDataDescriptionArraySfs);
            sdk.version(provider_version);
            sdk.prefix(first_provider_prefix);
            location.on("x.+{ip}", async (ctx, entity, input) => {
                await providerApiAdmin.post(`/${sdk.provider.prefix}/${sdk.provider.version}/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: entity.metadata.uuid,
                        kind: entity.metadata.kind
                    },
                    status: entity.spec
                })
            })
            location.on_create(async (ctx, entity) => {
                const { metadata, spec } = entity
                await ctx.update_status(metadata!, spec!)
            })
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await entityApi.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
                spec: {
                    x: [{
                        ip: "1"
                    }],
                    y: 11
                }
            })
            first_provider_to_delete_entites.push(metadata)
            await timeout(5000)
            const { data: { watcher } } = await entityApi.put(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`, {
                spec: {
                    x: [
                        { ip: "1" },
                        { ip: "2" }
                    ],
                    y: 11
                },
                metadata: {
                    spec_version: 1
                }
            })
            let retries = 10
            try {
                let watcherApi = sdk.get_intent_watcher_client()
                for (let i = 1; i <= retries; i++) {
                    const intent_watcher = await watcherApi.get(watcher.uuid)
                    if (intent_watcher.status === IntentfulStatus.Completed_Successfully) {
                        expect(intent_watcher.status).toBe(IntentfulStatus.Completed_Successfully)
                        const result = await entityApi.get(`/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`)
                        expect(result.data.status.x.length).toEqual(2)
                        return
                    }
                    await timeout(5000)
                }
            } catch (e) {
                console.log(`Couldn't get entity: ${e}`)
            }
        } finally {
            sdk.server.close();
        }
    })
})

describe("Intentful Workflow test sfs validation", () => {

    const locationDataDescription = new DescriptionBuilder().withBehaviour(IntentfulBehaviour.Differ).build()
    let provider_prefix: string
    let provider_version: Version = "0.1.0"


    test("Registering provider with wrong sfs shouldn't pass", async () => {
        expect.assertions(2);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            provider_prefix = "location_provider_intentful_fail_validation"
            const location = sdk.new_kind(locationDataDescription);
            sdk.version(provider_version);
            sdk.prefix(provider_prefix);
            location.on("wrong, wrong2", async (ctx, entity, input) => {
                await providerApiAdmin.patch(`/${ sdk.provider.prefix }/${ sdk.provider.version }/update_status`, {
                    context: "some context",
                    entity_ref: {
                        uuid: entity.metadata.uuid,
                        kind: entity.metadata.kind
                    },
                    status: { x: entity.spec.x }
                })
            })
            await sdk.register();
        } catch (e) {
            expect(e.response.status).toEqual(400)
            expect(e.response.data.error.errors[ 0 ].message).toContain("SFS: 'wrong, wrong2' validation on kind:" +
                ` ${Object.keys(locationDataDescription)[0]} failed with error: Parse error at line 1,`)
        }
    })
})
