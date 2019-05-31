import "jest"
import { load } from "js-yaml";
import { resolve } from "path";
import { Kind_Builder, ProviderSdk } from "papiea-sdk";
import { plural } from "pluralize"
import { loadYaml } from "./test_data_factory";
import axios from "axios"
import { readFileSync } from "fs";
import { Procedural_Signature, Procedural_Execution_Strategy } from "papiea-core";

declare var process: {
    env: {
        ADMIN_S2S_KEY: string
    }
};
const adminKey = process.env.ADMIN_S2S_KEY || '';
const papieaUrl = 'http://127.0.0.1:3000';

const procedure_callback = "http://127.0.0.1:9000/moveX";

const server_config = {
    host: "127.0.0.1",
    port: 9000
};

describe("Provider Sdk tests", () => {
    test("Pluralize works for 'test' & 'provider' words used", (done) => {
        expect(plural("test")).toBe("tests");
        expect(plural("provider")).toBe("providers");
        done();
    });
    const provider_version = "0.1.0";
    const location_yaml = load(readFileSync(resolve(__dirname, "./location_kind_test_data.yml"), "utf-8"));
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
    test("Provider with no x-papiea-entity should fail", (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const malformed_yaml = JSON.parse(JSON.stringify(location_yaml));
        malformed_yaml.Location["x-papiea-entity"] = "fail";
        try {
            sdk.new_kind(malformed_yaml);
        } catch (err) {
            expect(err).not.toBeNull();
            done();
        }
    });
    test("Provider without version should fail to register", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            sdk.new_kind(location_yaml);
            sdk.prefix("test_provider");
            await sdk.register();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: version");
            done();
        }
    });
    test("Provider without kind should fail to register", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            sdk.prefix("test_provider");
            sdk.version(provider_version);
            await sdk.register();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: kind");
            done();
        }
    });
    test("Provider without prefix should fail to register", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        try {
            sdk.new_kind(location_yaml);
            sdk.version(provider_version);
            await sdk.register();
        } catch (err) {
            expect(err.message).toBe("Malformed provider description. Missing: prefix");
            done();
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
    test("Provider should be created on papiea", async (done) => {
        jest.setTimeout(10000);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        try {
            await sdk.register();
        } catch (e) {
            done.fail(e)
        }
        done();
    });
    test("Provider with procedures should be created on papiea", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data;
        });
        try {
            await sdk.register();
        } catch (e) {
            done.fail(e)
        }
        sdk.server.close();
        done();
    });
    test("Entity should be allowed to be modified using procedures defined using provider SDK", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data;
        });
        await sdk.register();
        const kind_name = sdk.provider.kinds[0].name;
        const { data: { metadata, spec } } = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        try {
            const res: any = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }/procedure/moveX`, { input: 5 });
            const updatedEntity: any = await axios.get(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }`);
            expect(updatedEntity.data.metadata.spec_version).toEqual(2);
            expect(updatedEntity.data.spec.x).toEqual(15);
        } catch (e) {
            done.fail(e);
        } finally {
            sdk.server.close();
        }
        done();
    });
    test("Malformed handler registered on sdk should fail", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {

            throw new Error("Malformed provider")

        });
        await sdk.register();
        const kind_name = sdk.provider.kinds[0].name;
        const { data: { metadata, spec } } = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }`, {
            spec: {
                x: 10,
                y: 11
            }
        });
        try {
            const res: any = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/${ metadata.uuid }/procedure/moveX`, { input: 5 });
        } catch (e) {
            done();
        } finally {
            sdk.server.close();
        }
    });

    test("Registering Provider procedures without prefix already set should fail", async (done) => {
        expect.assertions(1);
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        try {
            location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {
                entity.spec.x += input;
                const res = await axios.put(ctx.url_for(entity), {
                    spec: entity.spec,
                    metadata: entity.metadata
                });
                return res.data;
            });
        } catch (e) {
            expect(e.message).toBe("Provider prefix is not set");
            done();
        }
    });

    test("Provider with kind level procedures should be created on papiea", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data;
        });

        const geolocationComputeProceduralSignature: Procedural_Signature = {
            name: "computeGeolocation",
            argument: loadYaml("./procedure_geolocation_compute_input.yml"),
            result: loadYaml("./procedure_geolocation_compute_input.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };

        location.kind_procedure(
            geolocationComputeProceduralSignature.name,
            {}, geolocationComputeProceduralSignature.execution_strategy,
            geolocationComputeProceduralSignature.argument,
            geolocationComputeProceduralSignature.result, async (ctx, input) => {
                let cluster_location = "us.west.";
                cluster_location += input;
                return cluster_location
            }
        );

        try {
            await sdk.register();
        } catch (e) {
            done.fail(e)
        }
        sdk.server.close();
        done();
    });

    test("Provider with kind level procedures should be executed", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data;
        });

        const geolocationComputeProceduralSignature: Procedural_Signature = {
            name: "computeGeolocation",
            argument: loadYaml("./procedure_geolocation_compute_input.yml"),
            result: loadYaml("./procedure_geolocation_compute_input.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };

        location.kind_procedure(
            geolocationComputeProceduralSignature.name,
            {}, geolocationComputeProceduralSignature.execution_strategy,
            geolocationComputeProceduralSignature.argument,
            geolocationComputeProceduralSignature.result, async (ctx, input) => {
                let cluster_location = "us.west.";
                cluster_location += input;
                return cluster_location
            }
        );
        await sdk.register();
        const kind_name = sdk.provider.kinds[0].name;
        try {
            const res: any = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/${ kind_name }/procedure/computeGeolocation`, { input: "2" });
            expect(res.data).toBe("us.west.2");
        } catch (e) {
            done.fail(e)
        }
        sdk.server.close();
        done();
    });

    test("Provider with provider level procedures should be created on papiea", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data;
        });
        const proceduralSignatureForProvider: Procedural_Signature = {
            name: "computeSum",
            argument: loadYaml("./procedure_sum_input.yml"),
            result: loadYaml("./procedure_sum_output.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        sdk.provider_procedure(proceduralSignatureForProvider.name,
            {},
            proceduralSignatureForProvider.execution_strategy,
            proceduralSignatureForProvider.argument,
            proceduralSignatureForProvider.result,
            async (ctx, input) => {
                return input.a + input.b;
            }
        );
        try {
            await sdk.register();
        } catch (e) {
            done.fail(e)
        }
        sdk.server.close();
        done();
    });

    test("Provider with provider level procedures should be executed", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data;
        });
        const proceduralSignatureForProvider: Procedural_Signature = {
            name: "computeSum",
            argument: loadYaml("./procedure_sum_input.yml"),
            result: loadYaml("./procedure_sum_output.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        sdk.provider_procedure(proceduralSignatureForProvider.name,
            {},
            proceduralSignatureForProvider.execution_strategy,
            proceduralSignatureForProvider.argument,
            proceduralSignatureForProvider.result,
            async (ctx, input) => {
                return input.a + input.b;
            }
        );
        await sdk.register();
        try {
            const res: any = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/procedure/computeSum`, { input: {"a": 5, "b": 5} });
            expect(res.data).toBe(10);
        } catch (e) {
            done.fail(e)
        }
        sdk.server.close();
        done();
    });

    test("Provider with provider level procedures should fail validation if wrong type is returned", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider");
        const proceduralSignature: Procedural_Signature = {
            name: "moveX",
            argument: loadYaml("./procedure_move_input.yml"),
            result: loadYaml("./location_kind_test_data.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        location.entity_procedure(proceduralSignature.name, {}, proceduralSignature.execution_strategy, proceduralSignature.argument, proceduralSignature.result, async (ctx, entity, input) => {
            entity.spec.x += input;
            const res = await axios.put(ctx.url_for(entity), {
                spec: entity.spec,
                metadata: entity.metadata
            });
            return res.data;
        });
        const proceduralSignatureForProvider: Procedural_Signature = {
            name: "computeSum",
            argument: loadYaml("./procedure_sum_input.yml"),
            result: loadYaml("./procedure_sum_output.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        sdk.provider_procedure(proceduralSignatureForProvider.name,
            {},
            proceduralSignatureForProvider.execution_strategy,
            proceduralSignatureForProvider.argument,
            proceduralSignatureForProvider.result,
            async (ctx, input) => {
                return "Totally not a number should fail provider-level validation";
            }
        );
        await sdk.register();
        try {
            const res: any = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/procedure/computeSum`, { input: {"a": 5, "b": 5} });
            done.fail();
        } catch (e) {
            console.log(e);
            done();
        }
        sdk.server.close();
        done();
    });

    test("Provider with provider level procedures should be allowed to be created without validation scheme", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider_no_validation_scheme");
        const proceduralSignatureForProvider: Procedural_Signature = {
            name: "computeSumWithNoValidation",
            argument: loadYaml("./procedure_sum_input.yml"),
            result: loadYaml("./procedure_sum_output.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        sdk.provider_procedure(proceduralSignatureForProvider.name,
            {},
            proceduralSignatureForProvider.execution_strategy,
            {},
            {},
            async (ctx, input) => {
            }
        );
        await sdk.register();
        try {
            const res: any = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/procedure/computeSum`, { input: {"a": 5, "b": 5} });
            done.fail();
        } catch (e) {
            console.log(e);
            done();
        }
        sdk.server.close();
        done();
    });

    test("Provider with provider level procedures should return error if the return type is not void", async (done) => {
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        const location = sdk.new_kind(location_yaml);
        sdk.version(provider_version);
        sdk.prefix("location_provider_no_validation_scheme");
        const proceduralSignatureForProvider: Procedural_Signature = {
            name: "computeSumWithNoValidation",
            argument: loadYaml("./procedure_sum_input.yml"),
            result: loadYaml("./procedure_sum_output.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: procedure_callback
        };
        sdk.provider_procedure(proceduralSignatureForProvider.name,
            {},
            proceduralSignatureForProvider.execution_strategy,
            {},
            {},
            async (ctx, input) => {
                return "Totally not a void type"
            }
        );
        await sdk.register();
        try {
            const res: any = await axios.post(`${ sdk.entity_url }/${ sdk.provider.prefix }/${ sdk.provider.version }/procedure/computeSum`, { input: {"a": 5, "b": 5} });
            done.fail();
        } catch (e) {
            console.log(e);
            done();
        }
        sdk.server.close();
        done();
    });
});