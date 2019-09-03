import "jest"
import { load } from "js-yaml";
import { resolve } from "path";
import { Kind_Builder, ProviderSdk } from "papiea-sdk";
import { plural } from "pluralize"
import { loadYaml, OAuth2Server, ProviderBuilder } from "../test_data_factory";
import axios from "axios"
import { readFileSync } from "fs";
import { Metadata, Procedural_Execution_Strategy, Provider, Spec, Action } from "papiea-core";
import uuid = require("uuid");
import { WinstonLogger } from "../../src/logger";
import Logger from "../../src/logger_interface";


declare var process: {
    env: {
        SERVER_PORT: string,
        PAPIEA_ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.PAPIEA_ADMIN_S2S_KEY || '';
const papieaUrl = 'http://127.0.0.1:3000';

const procedure_callback = "http://127.0.0.1:9000/moveX";

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

describe("Provider Sdk tests", () => {
    test("Pluralize works for 'test' & 'provider' words used", (done) => {
        expect(plural("test")).toBe("tests");
        expect(plural("provider")).toBe("providers");
        done();
    });
    const provider_version = "0.1.0";
    const location_yaml = load(readFileSync(resolve(__dirname, "../test_data/location_kind_test_data.yml"), "utf-8"));
    test("Yaml parses into walkable tree", (done) => {
        expect(location_yaml).not.toBeNull();
        expect(location_yaml.Location).not.toBeNull();
        done();
    });
    test("Yaml openapi spec-only model example contains valid structure", (done) => {
        expect(location_yaml.Location["x-papiea-entity"]).not.toBeUndefined();
        expect(location_yaml.Location["x-papiea-entity"]).toBe("spec-only");
        expect(location_yaml.Location["properties"]).not.toBeUndefined();
        const props = location_yaml.Location["properties"];
        for (let prop in props) {
            if (props.hasOwnProperty(prop)) {
                expect(props[prop]["type"]).not.toBeUndefined();
            }
        }
        done();
    });
    test("Wrong yaml description causes error", (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            sdk.new_kind({});
        } catch (err) {
            expect(err).not.toBeNull();
            done();
        }
    });
    test("Provider can create a new kind", (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location_manager = sdk.new_kind(location_yaml);
        expect(location_manager.kind.name).toBe("Location");
        done();
    });
    test("Provider without version should fail to register", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            sdk.new_kind(location_yaml);
            sdk.prefix("test_provider");
            await sdk.register();
            sdk.server.close();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: version");
        }
    });
    test("Provider without kind should fail to register", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            sdk.prefix("test_provider");
            sdk.version(provider_version);
            await sdk.register();
            sdk.server.close();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: kind");
        }
    });
    test("Provider without prefix should fail to register", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            sdk.new_kind(location_yaml);
            sdk.version(provider_version);
            await sdk.register();
            sdk.server.close();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: prefix");
        }
    });
    test("Add multiple kinds shouldn't fail", (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const geo_location_yaml = JSON.parse(JSON.stringify(location_yaml));
        sdk.new_kind(location_yaml);
        sdk.new_kind(geo_location_yaml);
        done();
    });
    let location_kind_manager: Kind_Builder;
    test("Duplicate delete on kind should return false", (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        location_kind_manager = sdk.new_kind(location_yaml);
        expect(sdk.remove_kind(location_kind_manager.kind)).toBeTruthy();
        expect(sdk.remove_kind(location_kind_manager.kind)).toBeFalsy();
        done();
    });
    test("Duplicate add on kind should return false", (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        expect(sdk.add_kind(location_kind_manager.kind)).not.toBeNull();
        expect(sdk.add_kind(location_kind_manager.kind)).toBeNull();
        done();
    });
    test("Provider should be created on papiea", async () => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        await sdk.register();
        try {
            sdk.server.close()
        } catch (e) {
        }
    });
    test("Provider with procedures should be created on papiea", async () => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data.spec;
        });
        try {
            await sdk.register();
        } finally {
            sdk.server.close();
        }
    });
    test("Entity should be allowed to be modified using procedures defined using provider SDK", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            const location = sdk.new_kind(location_yaml);
            sdk.version(provider_version);
            sdk.prefix("location_provider");
            location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
                entity.spec.x += input;
                const res = await axios.put(ctx.url_for(entity), {
                    spec: entity.spec,
                    metadata: entity.metadata
                });
                return res.data.spec;
            });
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });

            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/${kind_name}/${metadata.uuid}/procedure/moveX`, { input: 5 });
            const updatedEntity: any = await axios.get(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/${kind_name}/${metadata.uuid}`);
            expect(updatedEntity.data.metadata.spec_version).toEqual(2);
            expect(updatedEntity.data.spec.x).toEqual(15);
        } finally {
            sdk.server.close();
        }
    });
    test("Malformed handler registered on sdk should fail", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {

            throw new Error("Malformed provider")

        });
        try {
            await sdk.register();
            const kind_name = sdk.provider.kinds[0].name;
            const { data: { metadata, spec } } = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/${kind_name}`, {
                spec: {
                    x: 10,
                    y: 11
                }
            });
            try {
                const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/${kind_name}/${metadata.uuid}/procedure/moveX`, { input: 5 });
            } catch (e) {
                expect(e).toBeDefined();
            }
        } finally {
            sdk.server.close();
        }
    });

    test("Registering Provider procedures without prefix already set should fail", async () => {
        expect.assertions(1);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        try {
            location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
                entity.spec.x += input;
                const res = await axios.put(ctx.url_for(entity), {
                    spec: entity.spec,
                    metadata: entity.metadata
                });
                return res.data.spec;
            });
        } catch (e) {
            expect(e.message).toBe("Provider prefix is not set");
        }
    });

    test("Provider with kind level procedures should be created on papiea", async () => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data.spec;
        });
        location.kind_procedure(
            "computeGeolocation",
            {}, Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_geolocation_compute_input.yml"),
            loadYaml("./test_data/procedure_geolocation_compute_input.yml"), async (ctx, input) => {
                let cluster_location = "us.west.";
                cluster_location += input;
                return cluster_location
            }
        );

        try {
            await sdk.register();
        } finally {
            sdk.server.close();
        }
    });

    test("Provider with kind level procedures should be executed", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data.spec;
        });
        location.kind_procedure(
            "computeGeolocation",
            {}, Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_geolocation_compute_input.yml"),
            loadYaml("./test_data/procedure_geolocation_compute_input.yml"), async (ctx, input) => {
                let cluster_location = "us.west.";
                cluster_location += input;
                return cluster_location
            }
        );
        await sdk.register();
        const kind_name = sdk.provider.kinds[0].name;
        try {
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/${kind_name}/procedure/computeGeolocation`, { input: "2" });
            expect(res.data).toBe("us.west.2");
        } finally {
            sdk.server.close();
        }
    });

    test("Provider with provider level procedures should be created on papiea", async () => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data.spec;
        });
        sdk.provider_procedure("computeSum",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            loadYaml("./test_data/procedure_sum_output.yml"),
            async (ctx, input) => {
                return input.a + input.b;
            }
        );
        try {
            await sdk.register();
        } finally {
            sdk.server.close();
        }
    });

    test("Provider with provider level procedures should be executed", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data.spec;
        });
        sdk.provider_procedure("computeSum",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            loadYaml("./test_data/procedure_sum_output.yml"),
            async (ctx, input) => {
                return input.a + input.b;
            }
        );
        await sdk.register();
        try {
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeSum`, { input: { "a": 5, "b": 5 } });
            expect(res.data).toBe(10);
        } finally {
            sdk.server.close();
        }
    });

    test("Provider with provider level procedures should fail validation if wrong type is returned", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        location.entity_procedure("moveX", {}, Procedural_Execution_Strategy.Halt_Intentful, loadYaml("./test_data/procedure_move_input.yml"), loadYaml("./test_data/location_kind_test_data.yml"), async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data.spec;
        });
        sdk.provider_procedure("computeSum",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            loadYaml("./test_data/procedure_sum_output.yml"),
            async (ctx, input) => {
                return "Totally not a number should fail provider-level validation";
            }
        );
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeSum`, { input: { "a": 5, "b": 5 } });
        } catch (e) {
            expect(e.response.data.error.errors[0].message).toBe("Unable to validate a model with a type: string, expected: number");
        } finally {
            sdk.server.close();
        }
    });

    test("Provider with provider level procedures should be allowed to be created without validation scheme", async () => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider_no_validation_scheme");
        sdk.provider_procedure("computeSumWithNoValidation",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            {},
            {},
            async (ctx, input) => {
            }
        );
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeSumWithNoValidation`, { input: {} });
        } finally {
            sdk.server.close();
        }
    });

    test("Provider with provider level procedures should return error if the return type is not void", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider_no_validation_scheme");
        sdk.provider_procedure("computeSumWithNoValidation",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            {},
            {},
            async (ctx, input) => {
                return "Totally not a void type"
            }
        );
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeSumWithNoValidation`, { input: { "a": 5, "b": 5 } });
        } catch (e) {
            expect(e.response.data.error.errors[0].message).toBe('Function was expecting output of type void');
        } finally {
            sdk.server.close();
        }
    });

    test("Provider with provider level procedures throws error inside procedure", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider_throws_error");
        sdk.provider_procedure("computeSumThrowsError",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            loadYaml("./test_data/procedure_sum_output.yml"),
            async (ctx, input) => {
                throw new Error("My custom error")
            }
        );
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeSumThrowsError`, { input: { "a": 5, "b": 5 } });
        } catch (e) {
            expect(e.response.data.error.errors[0].message).toBe("My custom error");
            expect(e.response.data.error.errors[0].stacktrace).not.toBeUndefined();
        } finally {
            sdk.server.close();
        }
    });
});

describe("SDK security tests", () => {
    const oauth2ServerHost = '127.0.0.1';
    const oauth2ServerPort = 9002;
    const pathToModel: string = resolve(__dirname, "../../src/auth/provider_model_example.txt");
    const modelText: string = readFileSync(pathToModel).toString();
    const oauth = loadYaml("./test_data/auth.yaml");
    const provider_version = "0.1.0";
    const location_yaml = load(readFileSync(resolve(__dirname, "../test_data/location_kind_test_data.yml"), "utf-8"));
    const tenant_uuid = uuid();

    const provider: Provider = new ProviderBuilder()
        .withVersion("0.1.0")
        .withKinds()
        .withOAuth2Description()
        .withAuthModel()
        .build();
    const kind_name = provider.kinds[0].name;
    let entity_metadata: Metadata, entity_spec: Spec;
    const oauth2Server = OAuth2Server.createServer();
    const providerSDKTestLogger: Logger = new WinstonLogger("info", "provider_sdk_test.log");

    beforeAll(async () => {
        await providerApiAdmin.post('/', provider);
        oauth2Server.httpServer.listen(oauth2ServerPort, oauth2ServerHost, () => {
            providerSDKTestLogger.info(`Server running at http://${oauth2ServerHost}:${oauth2ServerPort}/`);
        });
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

    afterAll(async () => {
        await entityApi.delete(`/${provider.prefix}/${provider.version}/${kind_name}/${entity_metadata.uuid}`);
        await providerApiAdmin.delete(`/${provider.prefix}/${provider.version}`);
        oauth2Server.httpServer.close();
    });


    test("Procedure check permission read should fail", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_read_fail");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([[Action.Read, { uuid: entity_metadata.uuid, kind: kind_name }]], provider.prefix, provider.version);
                expect(allowed).toBeFalsy();
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, carol, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });

    test("Procedure check permission read should succeed", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_read_success");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([[Action.Read, { uuid: entity_metadata.uuid, kind: kind_name }]], provider.prefix, provider.version);
                expect(allowed).toBeTruthy();
            }
        );
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });

    test("Procedure check permission write should succeed", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_write_success");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([[Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "alice" }, created_at: {} as Date } as Metadata]], provider.prefix, provider.version);
                expect(allowed).toBeTruthy();
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });

    test("Procedure check permission write when read permission allowed should fail", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_write_success");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([[Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "alice" }, created_at: {} as Date } as Metadata]], provider.prefix, provider.version);
                expect(allowed).toBeFalsy();
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, read, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });

    test("Procedure check permission write should fail", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_write_fail");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([[Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "alice" }, created_at: {} as Date } as Metadata]], provider.prefix, provider.version);
                expect(allowed).toBeFalsy();
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, carol, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });

    test("Procedure check permission write with array should fail", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_write_fail");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([
                    [Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "alice" }, created_at: {} as Date } as Metadata],
                    [Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "jane" }, created_at: {} as Date } as Metadata]
                ], provider.prefix, provider.version);
                expect(allowed).toBeFalsy();
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });

    test("Procedure check permission write with array should succeed", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_write_fail");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([
                    [Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "alice" }, created_at: {} as Date } as Metadata],
                    [Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "alice" }, created_at: {} as Date } as Metadata]
                ], provider.prefix, provider.version);
                expect(allowed).toBeTruthy();
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });

    test("Procedure check permission write and read with array should succeed", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_write_fail");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([
                    [Action.Read, { uuid: entity_metadata.uuid, kind: kind_name }],
                    [Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "alice" }, created_at: {} as Date } as Metadata]
                ], provider.prefix, provider.version);
                expect(allowed).toBeTruthy();
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, *, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });

    test("Procedure check permission write and read with array should fail, read is denied", async () => {
        expect.hasAssertions();
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("permissioned_provider_write_fail");
        sdk.provider_procedure("computeWithPermissionCheck",
            {},
            Procedural_Execution_Strategy.Halt_Intentful,
            loadYaml("./test_data/procedure_sum_input.yml"),
            {},
            async (ctx, input) => {
                const allowed = await ctx.check_permission([
                    [Action.Read, { uuid: entity_metadata.uuid, kind: kind_name }],
                    [Action.Create, { uuid: entity_metadata.uuid, kind: kind_name, spec_version: 1, extension: { owner: "alice" }, created_at: {} as Date } as Metadata]
                ], provider.prefix, provider.version);
                expect(allowed).toBeFalsy();
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
            policy: `p, alice, owner, ${ kind_name }, create, allow`
        });
        sdk.secure_with(oauth, modelText, "xxx");
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        try {
            await sdk.register();
            const res: any = await axios.post(`${sdk.entity_url}/${sdk.provider.prefix}/${sdk.provider.version}/procedure/computeWithPermissionCheck`, { input: { "a": 5, "b": 5 } },
                { headers: { 'Authorization': `Bearer ${token}` }});
        } finally {
            sdk.server.close();
            await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/auth`, {
                policy: null
            });
        }
    });
});