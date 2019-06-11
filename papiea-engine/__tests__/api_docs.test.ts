import "jest"
import { writeFileSync, unlinkSync } from "fs";
import { validate } from "swagger-parser";
import axios from "axios"
import { loadYaml, ProviderBuilder } from "./test_data_factory";
import { Provider_DB } from "../src/databases/provider_db_interface";
import { Provider, Version, Procedural_Signature, Procedural_Execution_Strategy } from "papiea-core";
import ApiDocsGenerator from "../src/api_docs/api_docs_generator";
import { MongoConnection } from "../src/databases/mongo";

declare var process: {
    env: {
        SERVER_PORT: string,
        MONGO_DB: string,
        MONGO_HOST: string,
        MONGO_PORT: string
    }
};
const mongoHost = process.env.MONGO_HOST || 'mongo';
const mongoPort = process.env.MONGO_PORT || '27017';

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:9010/provider`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const api = axios.create({
    baseURL: `http://127.0.0.1:${ serverPort }/`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

class Provider_DB_Mock implements Provider_DB {
    provider: Provider;

    constructor() {
        this.provider = new ProviderBuilder().withVersion("0.1.0").withKinds().build();
        // @ts-ignore
        this.provider.procedures = undefined;   // can read such value from db
    }

    async save_provider(provider: Provider): Promise<void> {

    }

    async get_provider(provider_prefix: string, version?: Version): Promise<Provider> {
        return this.provider;
    }

    async list_providers(): Promise<Provider[]> {
        return [this.provider];
    }

    async delete_provider(provider_prefix: string, version: Version): Promise<void> {

    }

    async get_latest_provider_by_kind(kind_name: string): Promise<Provider> {
        throw new Error("Not implemented")
    }

    async find_providers(provider_prefix: string): Promise<Provider[]> {
        throw new Error("Not implemented")
    }

    async get_latest_provider(provider_prefix: string): Promise<Provider> {
        throw new Error("Not implemented")
    }
}

describe("API Docs Tests", () => {

    const providerDbMock = new Provider_DB_Mock();
    const apiDocsGenerator = new ApiDocsGenerator(providerDbMock);
    test("Validate API Docs agains OpenAPI spec", async (done) => {
        try {
            const apiDoc = await apiDocsGenerator.getApiDocs();
            const apiDocJson = JSON.stringify(apiDoc);
            writeFileSync("api-docs.json", apiDocJson);
            const api = await validate("api-docs.json");
            expect(api.info.title).toEqual("Swagger Papiea");
            done();
        } catch (err) {
            done.fail(err);
        } finally {
            unlinkSync("api-docs.json");
        }
    });
    test("API Docs should contain paths for CRUD", async (done) => {
        try {
            const providerPrefix = providerDbMock.provider.prefix;
            const entityName = providerDbMock.provider.kinds[0].name;
            const providerVersion = providerDbMock.provider.version;
            const apiDoc = await apiDocsGenerator.getApiDocs();
            expect(Object.keys(apiDoc.paths)).toContain(`/services/${ providerPrefix }/${ providerVersion }/${ entityName }`);
            const kindPath = apiDoc.paths[`/services/${ providerPrefix }/${ providerVersion }/${ entityName }`];
            expect(Object.keys(kindPath)).toContain("get");
            expect(Object.keys(kindPath)).toContain("post");
            expect(Object.keys(apiDoc.paths)).toContain(`/services/${ providerPrefix }/${ providerVersion }/${ entityName }/{uuid}`);
            const kindEntityPath = apiDoc.paths[`/services/${ providerPrefix }/${ providerVersion }/${ entityName }/{uuid}`];
            expect(Object.keys(kindEntityPath)).toContain("get");
            expect(Object.keys(kindEntityPath)).toContain("delete");
            expect(Object.keys(kindEntityPath)).toContain("put");
            done();
        } catch (err) {
            done.fail(err);
        }
    });
    test("API Docs should contain Location scheme", async (done) => {
        try {
            const apiDoc = await apiDocsGenerator.getApiDocs();
            const entityName = providerDbMock.provider.kinds[0].name;
            expect(Object.keys(apiDoc.components.schemas)).toContain(entityName);
            const entitySchema = apiDoc.components.schemas[entityName];
            expect(entitySchema).toEqual({
                "type": "object",
                "title": "X\/Y Location",
                "description": "Stores an XY location of something",
                "x-papiea-entity": "spec-only",
                "required": ["x", "y"],
                "properties": {
                    "x": {
                        "type": "number"
                    },
                    "y": {
                        "type": "number"
                    }
                }
            });
            done();
        } catch (err) {
            done.fail(err);
        }
    });
    test("API Docs should be accessible by the url", done => {
        api.get("/api-docs/api-docs.json").then(() => done()).catch(done.fail);
    });
});

describe("API docs test entity", () => {
    const hostname = '127.0.0.1';
    const port = 9001;
    let mongoConnection: MongoConnection;
    let providerDb: Provider_DB;
    let apiDocsGenerator: ApiDocsGenerator;
    const provider: Provider = new ProviderBuilder()
        .withVersion("0.1.0")
        .withKinds()
        .withCallback(`http://${ hostname }:${ port }`)
        .withEntityProcedures()
        .withKindProcedures()
        .withProviderProcedures()
        .build();
    const kind_name = provider.kinds[0].name;

    beforeAll(async () => {
        mongoConnection = new MongoConnection(`mongodb://${ mongoHost }:${ mongoPort }`, process.env.MONGO_DB || 'papiea');
        await mongoConnection.connect();
        providerDb = await mongoConnection.get_provider_db();
        apiDocsGenerator = new ApiDocsGenerator(providerDb);
        await providerApi.post('/', provider);
    });

    afterAll(async () => {
        await providerApi.delete(`/${ provider.prefix }/${ provider.version }`);
        await mongoConnection.close();
    });

    test("Provider with procedures generates correct openAPI spec", async done => {
        const procedure_id = "computeSumNoValidation";
        const proceduralSignatureForProvider: Procedural_Signature = {
            name: "computeSumWithNoValidation",
            argument: loadYaml("./procedure_sum_input.yml"),
            result: loadYaml("./procedure_sum_output.yml"),
            execution_strategy: Procedural_Execution_Strategy.Halt_Intentful,
            procedure_callback: "127.0.0.1:9011"
        };
        const provider: Provider = new ProviderBuilder("provider_no_validation_scheme")
            .withVersion("0.1.0")
            .withKinds()
            .withCallback(`http://127.0.0.1:9010`)
            .withProviderProcedures({ [procedure_id]: proceduralSignatureForProvider })
            .withKindProcedures()
            .withEntityProcedures()
            .build();
        try {
            await providerApi.post('/', provider);
            const apiDoc = await apiDocsGenerator.getApiDocs();
            console.dir(apiDoc.paths);
            expect(apiDoc.paths[`/services/${ provider.prefix }/${ provider.version }/procedure/${ procedure_id }`]
                .post
                .requestBody
                .content["application/json"]
                .schema
                .properties
                .input['$ref']).toEqual(`#/components/schemas/AnyValue`);

            expect(apiDoc.paths[`/services/${ provider.prefix }/${ provider.version }/procedure/${ procedure_id }`]
                .post
                .responses["200"]
                .content["application/json"]
                .schema
                .properties
                .input['$ref']).toEqual(`#/components/schemas/AnyValue`);

            done();
            providerApi.delete(`${ provider.prefix }/${ provider.version }`)
        } catch (e) {
            done.fail(e);
        }
    })
});