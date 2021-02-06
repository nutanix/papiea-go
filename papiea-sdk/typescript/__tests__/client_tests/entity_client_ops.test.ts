import { load } from "js-yaml";
import { resolve } from "path";
import { readFileSync } from "fs";
import { loadYamlFromTestFactoryDir, OAuth2Server, ProviderBuilder } from "../../../../papiea-engine/__tests__/test_data_factory";
import axios from "axios"
import * as http from "http";
import { ProviderSdk } from "../../src/provider_sdk/typescript_sdk";
import { LoggerFactory } from "papiea-backend-utils";
import { kind_client, EntityCRUD } from "papiea-client"
import { IntentfulStatus, Metadata, Provider, Spec } from "papiea-core"
import uuid = require("uuid");
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from "constants";

const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';
const papieaUrl = 'http://127.0.0.1:3000';

const server_config = {
    host: "127.0.0.1",
    port: 9000
};

const providerApiAdmin = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
    }
});

const entityApiAdmin = axios.create({
        baseURL: `http://127.0.0.1:${serverPort}/services`,
        timeout: 1000,
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${adminKey}`
        },
});

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Papiea Entity Client API success tests", () => {
    const provider_version = "0.1.0";
    const location_yaml = load(readFileSync(resolve(__dirname, "../test_data/location_kind_test_data_callback.yml"), "utf-8"));
    let prefix: string
    let kind_name: string

    afterEach(async () => {
        await providerApiAdmin.delete(`/${prefix}/${provider_version}`);
    });

    test("Entity API create call should succeed", async () => {
        expect.assertions(3);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_create"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            const entity = await location_client.create({ x: 10, y: 11 })

            expect(entity.metadata).toBeDefined()
            expect(entity.spec.x).toEqual(10)
            expect(entity.spec.y).toEqual(11)

            await location_client.delete(entity.metadata)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API get call should succeed", async () => {
        expect.assertions(4);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_get"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            const entity = await location_client.create({ x: 10, y: 11 })
            
            expect(entity.metadata).toBeDefined()
            const ret_entity = await location_client.get(entity.metadata)

            expect(ret_entity.metadata).toBeDefined()
            expect(ret_entity.spec.x).toEqual(10)
            expect(ret_entity.spec.y).toEqual(11)

            await location_client.delete(entity.metadata)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API update call should succeed", async () => {
        expect.assertions(7);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_update"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            const entity = await location_client.create({ x: 10, y: 11 })

            expect(entity.metadata).toBeDefined()
            const watcher = await location_client.update(entity.metadata, {x: 12, y: 11})
            const ret_entity = await location_client.get(entity.metadata)

            expect(entity.spec.x).toEqual(10)
            expect(entity.spec.y).toEqual(11)
            expect(watcher!.status).toEqual(IntentfulStatus.Active)
            expect(ret_entity.metadata).toBeDefined()
            expect(ret_entity.spec.x).toEqual(12)
            expect(ret_entity.spec.y).toEqual(11)

            await location_client.delete(entity.metadata)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API delete call should succeed", async () => {
        expect.assertions(6);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_delete"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            const entity = await location_client.create({ x: 10, y: 11 })

            expect(entity.metadata).toBeDefined()
            expect(entity.spec.x).toEqual(10)
            expect(entity.spec.y).toEqual(11)

            await location_client.delete(entity.metadata)

            await location_client.get(entity.metadata)
        } catch(err) {
            expect(err.response.data).toBeDefined()
            expect(err.response.data.error.code).toBe(404)
            expect(err.response.data.error.message).toContain("Entity not found")
        }finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API invoke entity procedure call should succeed", async () => {
        expect.assertions(7);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_invoke_entity_procedure"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.entity_procedure(
            "moveX",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_move_input.yml"),
             output_schema: loadYamlFromTestFactoryDir("./test_data/location_kind_test_data.yml")},
            async (ctx, entity, input) => {
                entity.spec.x += input.x;
                const res = await axios.put(ctx.url_for(entity), {
                    spec: entity.spec,
                    metadata: entity.metadata
                });
                return entity.spec;
        });
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            const entity = await location_client.create({ x: 10, y: 11 })

            expect(entity.metadata).toBeDefined()
            await location_client.invoke_procedure("moveX", entity.metadata, { x: 2 })
            const ret_entity = await location_client.get(entity.metadata)

            expect(entity.spec.x).toEqual(10)
            expect(entity.spec.y).toEqual(11)
            expect(ret_entity.metadata).toBeDefined()
            expect(ret_entity.metadata.spec_version).toEqual(2);
            expect(ret_entity.spec.x).toEqual(12)
            expect(ret_entity.spec.y).toEqual(11)

            await location_client.delete(entity.metadata)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API invoke kind procedure call should succeed", async () => {
        expect.assertions(1);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_invoke_kind_procedure"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.kind_procedure(
            "computeGeolocation",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_geolocation_compute_input.yml"),
             output_schema: loadYamlFromTestFactoryDir("./test_data/procedure_geolocation_compute_input.yml")},
            async (ctx, input) => {
                let cluster_location = "us.west.";
                cluster_location += input.region_id;
                return { "region_id": cluster_location }
            }
        );
        try {

            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            const ret_cluster = await location_client.invoke_kind_procedure("computeGeolocation", { region_id: "2" })

            expect(ret_cluster.region_id).toBe("us.west.2")
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API filter call with metadata should succeed", async () => {
        expect.assertions(4);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_filter_metadata"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            const entity1 = await location_client.create({ x: 10, y: 11 })
            const entity2 = await location_client.create({x: 10, y: 12})
            expect(entity1.metadata).toBeDefined()
            expect(entity2.metadata).toBeDefined()

            const filter_val = {metadata: {uuid: entity1.metadata.uuid}}
            const {results, entity_count} = await location_client.filter(filter_val)
            expect(results.length).toBe(1)
            expect(entity_count).toBe(1)

            await location_client.delete(entity1.metadata)
            await location_client.delete(entity2.metadata)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API filter iter call with metadata should succeed", async () => {
        expect.assertions(4);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_filter_iter_metadata"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            const entity1 = await location_client.create({ x: 10, y: 11 })
            const entity2 = await location_client.create({ x: 10, y: 12 })
            expect(entity1.metadata).toBeDefined()
            expect(entity2.metadata).toBeDefined()

            const filter_val = {metadata: {uuid: entity1.metadata.uuid}}
            const iterator = await location_client.filter_iter(filter_val)
            let entity_count = 0
            for await (const entity of iterator()) {
                expect(entity.metadata).toBeDefined()
                entity_count++
            }
            expect(entity_count).toBe(1)

            await location_client.delete(entity1.metadata)
            await location_client.delete(entity2.metadata)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API list iter call should succeed", async () => {
        expect.assertions(3);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_list_iter"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            const entity1 = await location_client.create({ x: 10, y: 11 })
            const entity2 = await location_client.create({ x: 10, y: 12 })
            expect(entity1.metadata).toBeDefined()
            expect(entity2.metadata).toBeDefined()

            const iterator = await location_client.list_iter()
            let entity_count = 0
            for await (const entity of iterator()) {
                entity_count++
            }
            expect(entity_count).toBeGreaterThanOrEqual(2)

            await location_client.delete(entity1.metadata)
            await location_client.delete(entity2.metadata)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API filter call with deleted entity should succeed", async () => {
        expect.assertions(9);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_filter_deleted"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            const entity1 = await location_client.create({ x: 10, y: 11 })
            expect(entity1.metadata).toBeDefined()

            await location_client.delete(entity1.metadata)

            let filter_val: any = {metadata: { uuid: entity1.metadata.uuid } }
            const {results, entity_count} = await location_client.filter(filter_val)
            expect(results.length).toBe(0)
            expect(entity_count).toBe(0)

            const query_string = 'deleted=true'
            for (const deleted_at of ["papiea_one_hour_ago", "papiea_one_day_ago"]) {
                filter_val = {metadata: { uuid: entity1.metadata.uuid, deleted_at: deleted_at } }
                const {results, entity_count} = await location_client.filter(filter_val, query_string)
                expect(entity_count).toBe(1)
                expect(results[0].spec).toEqual(entity1.spec)
                expect(results[0].status).toEqual(entity1.spec)
            }
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API filter call with sort query should succeed", async () => {
        expect.assertions(1);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_filter_sort"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            for (let i = 0; i < 70; i++) {
                await location_client.create({
                    x: i,
                    y: 70
                });
            }

            const filter_val = {spec: {y: 70}}
            const query_string = "sort=spec.x"
            const {results, entity_count} = await location_client.filter(filter_val, query_string)
            expect(results[0].spec.x).toBe(0);
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });
});

describe("Papiea Entity Client API with Auth tests", () => {
    const oauth2ServerHost = '127.0.0.1';
    const oauth2ServerPort = 9002;
    const pathToModel: string = resolve(__dirname, "../test_data/provider_model_example.txt");
    const modelText: string = readFileSync(pathToModel).toString();
    const oauth = loadYamlFromTestFactoryDir("./test_data/auth.yaml");
    const provider_version = "0.1.0";
    const location_yaml = load(readFileSync(resolve(__dirname, "../test_data/location_kind_test_data.yml"), "utf-8"));
    const tenant_uuid = uuid();
    const procedureCallbackHostname = "127.0.0.1";
    const procedureCallbackPort = 9001;
    let prefix: string

    const provider: Provider = new ProviderBuilder()
        .withVersion("0.1.0")
        .withKinds()
        .withCallback(`http://${procedureCallbackHostname}:${procedureCallbackPort}`)
        .withEntityProcedures()
        .withOAuth2Description()
        .withAuthModel()
        .build();
    const kind_name = provider.kinds[0].name;
    let entity_metadata: Metadata, entity_spec: Spec;
    const oauth2Server = OAuth2Server.createServer();
    const providerSDKTestLogger = LoggerFactory.makeLogger({level: "info"});

    beforeAll(async () => {
        await providerApiAdmin.post('/', provider);
        oauth2Server.httpServer.listen(oauth2ServerPort, oauth2ServerHost, () => {
            providerSDKTestLogger.info(`Server running at http://${oauth2ServerHost}:${oauth2ServerPort}/`);
        });
    });

    beforeEach(async () => {
        const { data: { metadata, spec } } = await entityApi.post(`/${ provider.prefix }/${ provider.version }/${ kind_name }`, {
            metadata: {
                extension: {
                    owner: "alice",
                    tenant_uuid: tenant_uuid
                }
            },
            spec: {
                x: 10,
                y: 11
            }
        });
        entity_metadata = metadata;
        entity_spec = spec;
    });

    afterEach(async () => {
        await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/auth`, {
            policy: null
        });
        await entityApiAdmin.delete(`/${provider.prefix}/${provider.version}/${kind_name}/${entity_metadata.uuid}`);
    });

    afterAll(async () => {
        await providerApiAdmin.delete(`/${provider.prefix}/${provider.version}`);
        oauth2Server.httpServer.close();
    });

    test("Entity API get call with authorized user token should succeed", async () => {
        expect.assertions(4);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_get_authorized_token"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        sdk.provider_procedure(
            "computeWithPermissionCheck",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_sum_input.yml")},
            async (ctx, input) => {
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            location_client = kind_client(papieaUrl, provider.prefix, kind_name, provider.version, token)

            expect(entity_metadata).toBeDefined()
            expect(entity_spec).toBeDefined()

            const ret_entity = await location_client.get(entity_metadata)

            expect(ret_entity.metadata).toEqual(entity_metadata);
            expect(ret_entity.spec).toEqual(entity_spec);
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup();
        }
    });

    test("Entity API get call with unauthorized user token should throw permission denied error", async () => {
        expect.assertions(4);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_get_unauthorized_token"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        sdk.provider_procedure(
            "computeWithPermissionCheck",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_sum_input.yml")},
            async (ctx, input) => {
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, carol, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            location_client = kind_client(papieaUrl, provider.prefix, kind_name, provider.version, token)

            expect(entity_metadata).toBeDefined()
            expect(entity_spec).toBeDefined()

            await location_client.get(entity_metadata)
        } catch (err) {
            expect(err.response.data.error.code).toEqual(403)
            expect(err.response.data.error.message).toBe("Permission denied.")
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup();
        }
    });

    test("Entity API update call with authorized user token should succeed", async () => {
        expect.assertions(6);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_update_authorized_token"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        sdk.provider_procedure(
            "computeWithPermissionCheck",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_sum_input.yml")},
            async (ctx, input) => {
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            location_client = kind_client(papieaUrl, provider.prefix, kind_name, provider.version, token)

            expect(entity_metadata).toBeDefined()
            expect(entity_spec).toBeDefined()

            await location_client.update(entity_metadata, { x: 12, y: 11 })
            const ret_entity = await location_client.get(entity_metadata)

            expect(ret_entity.metadata).toBeDefined()
            expect(ret_entity.metadata.spec_version).toEqual(2);
            expect(ret_entity.spec.x).toEqual(12)
            expect(ret_entity.spec.y).toEqual(11)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup();
        }
    });

    test("Entity API update call with unauthorized user token should throw permission denied error", async () => {
        expect.assertions(4);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_update_unauthorized_token"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        sdk.provider_procedure(
            "computeWithPermissionCheck",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_sum_input.yml")},
            async (ctx, input) => {
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, carol, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            location_client = kind_client(papieaUrl, provider.prefix, kind_name, provider.version, token)

            expect(entity_metadata).toBeDefined()
            expect(entity_spec).toBeDefined()

            await location_client.update(entity_metadata, { x: 12, y: 11 })
        } catch (err) {
            expect(err.response.data.error.code).toEqual(403)
            expect(err.response.data.error.message).toBe("Permission denied.")
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup();
        }
    });

    test("Entity API get call with authorized s2skey should succeed", async () => {
        expect.assertions(4);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_get_authorized_s2skey"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        sdk.provider_procedure(
            "computeWithPermissionCheck",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_sum_input.yml")},
            async (ctx, input) => {
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });

        const { data: { token } } = await providerApi.get(`/${ provider.prefix }/${ provider.version }/auth/login`);
        const { data: user_info } = await providerApi.get(`/${ provider.prefix }/${ provider.version }/auth/user_info`,
            { headers: { 'Authorization': 'Bearer ' + token } }
        );

        const { data: s2skey } = await providerApi.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                owner: user_info.owner
            },
            { headers: { 'Authorization': 'Bearer ' + token } }
        );
        sdk.secure_with(oauth, modelText, "xxx");
        try {
            await sdk.register();
            location_client = kind_client(papieaUrl, provider.prefix, kind_name, provider.version, s2skey.key)

            expect(entity_metadata).toBeDefined()
            expect(entity_spec).toBeDefined()

            const ret_entity = await location_client.get(entity_metadata)

            expect(ret_entity.metadata).toEqual(entity_metadata);
            expect(ret_entity.spec).toEqual(entity_spec);
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup();
        }
    });

    test("Entity API entity procedure call with authorized user token should succeed", async () => {
        expect.assertions(6);
        const server = http.createServer((req, res) => {
            if (req.method == 'POST') {
                let body = '';
                req.on('data', function (data) {
                    body += data;
                });
                req.on('end', function () {
                    const post = JSON.parse(body);
                    post.spec.x += post.input.x;
                    const authorization = req.headers['authorization'];
                    entityApi.put(`/${provider.prefix}/${provider.version}/${kind_name}/${post.metadata.uuid}`, {
                        spec: post.spec,
                        metadata: post.metadata
                    }, { headers: { 'Authorization': authorization } }
                    ).then(() => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(JSON.stringify(post.spec));
                        server.close();
                    }).catch((err) => {
                        res.statusCode = err.response.status;
                        res.end();
                        server.close();
                    });
                });
            }
        });
        server.listen(procedureCallbackPort, procedureCallbackHostname, () => {
            providerSDKTestLogger.info(`Server running at http://${ procedureCallbackHostname }:${ procedureCallbackPort }/`);
        });
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_entity_procedure_authorized_token"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        sdk.provider_procedure(
            "computeWithPermissionCheck",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_sum_input.yml")},
            async (ctx, input) => {
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            location_client = kind_client(papieaUrl, provider.prefix, kind_name, provider.version, token)

            expect(entity_metadata).toBeDefined()
            expect(entity_spec).toBeDefined()

            await location_client.invoke_procedure("moveX", entity_metadata, { x: 2 })
            const ret_entity = await location_client.get(entity_metadata)

            expect(ret_entity.metadata).toBeDefined()
            expect(ret_entity.metadata.spec_version).toEqual(2);
            expect(ret_entity.spec.x).toEqual(12)
            expect(ret_entity.spec.y).toEqual(11)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup();
        }
    });

    test("Entity API entity procedure call with unauthorized user token should throw permission denied error", async () => {
        expect.assertions(4);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_entity_procedure_unauthorized_token"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        sdk.provider_procedure(
            "computeWithPermissionCheck",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_sum_input.yml")},
            async (ctx, input) => {
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, carol, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            location_client = kind_client(papieaUrl, provider.prefix, kind_name, provider.version, token)

            expect(entity_metadata).toBeDefined()
            expect(entity_spec).toBeDefined()

            await location_client.invoke_procedure("moveX", entity_metadata, { x: 2 })
        } catch (err) {
            expect(err.response.data.error.code).toEqual(403)
            expect(err.response.data.error.message).toBe("Permission denied.")
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup();
        }
    });
});

describe("Papiea Entity Client API failure tests", () => {
    const provider_version = "0.1.0";
    const location_yaml = load(readFileSync(resolve(__dirname, "../test_data/location_kind_test_data_callback.yml"), "utf-8"));
    let prefix: string
    let kind_name: string

    afterEach(async () => {
        await providerApiAdmin.delete(`/${prefix}/${provider_version}`);
    });

    test("Entity API create call with malformed spec should fail", async () => {
        expect.assertions(2);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_create_malformed_spec"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            await location_client.create({ x: "Not a number", y: 11 })
        } catch (err) {
            expect(err.response.data.error.code).toEqual(400)
            expect(err.response.data.error.errors[0].message).toBe("x (Not a number) is not a type of number")
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API create call with invalid UUID should fail", async () => {
        expect.assertions(2);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_create_invalid_uuid"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input,
                metadata: {uuid: '123'}
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            await location_client.create({ x: 10, y: 11 })
        } catch (err) {
            expect(err.response.data.error.code).toEqual(500)
            expect(err.response.data.error.errors[0].message).toBe("uuid is not valid")
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API create call with duplicate UUID should fail", async () => {
        expect.assertions(6);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_create_duplicate_uuid"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        const entity_uuid = uuid();
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input,
                metadata: {uuid: entity_uuid}
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            const entity = await location_client.create({ x: 10, y: 11 })
            expect(entity.metadata).toBeDefined()
            expect(entity.metadata.uuid).toEqual(entity_uuid)
            expect(entity.spec.x).toBe(10)
            expect(entity.spec.y).toBe(11)

            await location_client.create({ x: 10, y: 11})
        } catch (err) {
            expect(err.response.data.error.code).toEqual(409)
            expect(err.response.data.error.errors[0].message).toBe(`Conflicting Entity: ${entity_uuid}. Existing entity has version 1`)
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API get call on undefined entity should fail", async () => {
        expect.assertions(2);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_get_undefined"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            await location_client.get({uuid: 'Undefined Entity UUID', kind: kind_name})
        } catch (err) {
            expect(err.response.data.error.code).toEqual(404)
            expect(err.response.data.error.errors[0].message).toBe("Entity Undefined Entity UUID not found")
        }finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API update call with malformed spec should fail", async () => {
        expect.assertions(5);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_update_malformed_spec"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            const entity = await location_client.create({ x: 10, y: 11 })

            expect(entity.metadata).toBeDefined()
            expect(entity.spec.x).toEqual(10)
            expect(entity.spec.y).toEqual(11)

            await location_client.update(entity.metadata, {x: "Not a number", y: 11})
        } catch (err) {
            expect(err.response.data.error.code).toEqual(400)
            expect(err.response.data.error.errors[0].message).toBe("x (Not a number) is not a type of number")
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API delete call on undefined entity should fail", async () => {
        expect.assertions(2);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_delete_undefined"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)

            await location_client.delete({uuid: 'Undefined Entity UUID', kind: kind_name})
        } catch (err) {
            expect(err.response.data.error.code).toEqual(404)
            expect(err.response.data.error.errors[0].message).toBe("Entity Undefined Entity UUID not found")
        }finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API invoke entity procedure call with invalid input should throw validation error", async () => {
        expect.assertions(5);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_invoke_entity_procedure_invalid_input"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.entity_procedure(
            "moveX",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_move_input.yml"),
                output_schema: loadYamlFromTestFactoryDir("./test_data/location_kind_test_data.yml")},
            async (ctx, entity, input) => {
                entity.spec.x += input.x;
                const res = await axios.put(ctx.url_for(entity), {
                    spec: entity.spec,
                    metadata: entity.metadata
                });
                return entity.spec;
        });
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            const entity = await location_client.create({ x: 10, y: 11 })

            expect(entity.metadata).toBeDefined()
            expect(entity.spec.x).toBe(10)
            expect(entity.spec.y).toBe(11)
            await location_client.invoke_procedure("moveX", entity.metadata, { x: "2" })
        } catch (err) {
            expect(err.response.data.error.code).toBe(400)
            expect(err.response.data.error.errors[0].message).toBe("x (2) is not a type of number")
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });

    test("Entity API invoke entity procedure call with invalid result should throw error", async () => {
        expect.assertions(7);
        let location_client: EntityCRUD | undefined
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        prefix = "provider_entity_api_invoke_entity_procedure_invalid_result"
        sdk.version(provider_version);
        sdk.prefix(prefix);
        location.entity_procedure(
            "moveX",
            {input_schema: loadYamlFromTestFactoryDir("./test_data/procedure_move_input.yml"),
                output_schema: loadYamlFromTestFactoryDir("./test_data/location_kind_test_data.yml")},
            async (ctx, entity, input) => {
                return { "wrong": "result" }
        });
        location.on_create({input_schema: location_yaml}, async (ctx, input) => {
            return {
                spec: input,
                status: input
            }
        })
        try {
            await sdk.register()
            kind_name = sdk.provider.kinds[0].name
            location_client = kind_client(papieaUrl, prefix, kind_name, provider_version, adminKey)
            const entity = await location_client.create({ x: 10, y: 11 })

            expect(entity.metadata).toBeDefined()
            expect(entity.spec.x).toBe(10)
            expect(entity.spec.y).toBe(11)
            await location_client.invoke_procedure("moveX", entity.metadata, { x: 2 })
        } catch (err) {
            expect(err.response.data.error.code).toEqual(500)
            expect(err.response.data.error.errors.length).toEqual(2);
            expect(err.response.data.error.errors[0].message).toEqual("x is a required field");
            expect(err.response.data.error.errors[1].message).toEqual("y is a required field");
        } finally {
            if (location_client) {
                location_client.close()
            }
            sdk.cleanup()
        }
    });
});