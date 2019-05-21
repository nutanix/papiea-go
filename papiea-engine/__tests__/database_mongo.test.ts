import "jest"
import { MongoConnection } from "../src/databases/mongo";
import { Spec_DB } from "../src/databases/spec_db_interface";
import { Status_DB } from "../src/databases/status_db_interface";
import { Provider_DB } from "../src/databases/provider_db_interface";
import { v4 as uuid4 } from 'uuid';
import { ConflictingEntityError } from "../src/databases/utils/errors";
import { Metadata, Spec, Entity_Reference, Status, Kind, Provider } from "papiea-core";

declare var process: {
    env: {
        MONGO_DB: string,
        MONGO_HOST: string,
        MONGO_PORT: string
    }
};
const mongoHost = process.env.MONGO_HOST || 'mongo'
const mongoPort = process.env.MONGO_PORT || '27017'

describe("MongoDb tests", () => {
    const connection: MongoConnection = new MongoConnection(`mongodb://${mongoHost}:${mongoPort}`, process.env.MONGO_DB || 'papiea');
    beforeEach(() => {
        jest.setTimeout(50000);
    });
    beforeAll(done => {
        connection.connect().then(done).catch(done.fail);
    });
    afterAll(done => {
        connection.close().then(done).catch(done.fail);
    });
    const entityA_uuid = uuid4();
    test("Insert Spec", async (done) => {
        const specDb: Spec_DB = await connection.get_spec_db();
        const entity_metadata: Metadata = {
            uuid: entityA_uuid,
            kind: "test",
            spec_version: 0,
            created_at: new Date(),
            deleted_at: undefined,
            extension: {}
        };
        const spec: Spec = { a: "A" };
        await specDb.update_spec(entity_metadata, spec);
        done();
    });
    test("Update Spec", async (done) => {
        const specDb: Spec_DB = await connection.get_spec_db();
        const entity_metadata: Metadata = {
            uuid: entityA_uuid,
            kind: "test",
            spec_version: 1,
            created_at: new Date(),
            deleted_at: undefined,
            extension: {}
        };
        const spec: Spec = { a: "A1" };
        await specDb.update_spec(entity_metadata, spec);
        done();
    });
    test("Update Spec with same version should fail", async (done) => {
        expect.assertions(2);
        const specDb: Spec_DB = await connection.get_spec_db();
        const entity_metadata: Metadata = {
            uuid: entityA_uuid,
            kind: "test",
            spec_version: 1,
            created_at: new Date(),
            deleted_at: undefined,
            extension: {}
        };
        const spec: Spec = { a: "A2" };
        try {
            await specDb.update_spec(entity_metadata, spec);
            done.fail();
        } catch (err) {
            expect(err).toBeInstanceOf(ConflictingEntityError);
            expect(err.existing_metadata.spec_version).toEqual(2);
            done();
        }
    });
    test("Get Spec", async (done) => {
        expect.assertions(5);
        const specDb: Spec_DB = await connection.get_spec_db();
        const entity_ref: Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        const res = await specDb.get_spec(entity_ref);
        expect(res).not.toBeNull();
        if (res === null) {
            done.fail("Entity without spec");
            return;
        }
        const [metadata, spec] = res;
        expect(metadata.uuid).toEqual(entity_ref.uuid);
        expect(metadata.created_at).not.toBeNull();
        expect(metadata.deleted_at).toBeFalsy();
        expect(spec.a).toEqual("A1");
        done();
    });
    test("Get Spec for non existing entity should fail", async (done) => {
        expect.assertions(1);
        const specDb: Spec_DB = await connection.get_spec_db();
        const entity_ref: Entity_Reference = { uuid: uuid4(), kind: "test" };
        try {
            await specDb.get_spec(entity_ref);
            done.fail();
        } catch (err) {
            expect(err).not.toBeNull();
            done();
        }
    });
    test("List Specs", async (done) => {
        expect.assertions(1);
        const specDb: Spec_DB = await connection.get_spec_db();
        const res = await specDb.list_specs({ metadata: { "kind": "test" } });
        expect(res.length).toBeGreaterThanOrEqual(1);
        done();
    });
    test("List Specs - check spec data", async (done) => {
        expect.assertions(4);
        const specDb: Spec_DB = await connection.get_spec_db();
        const res = await specDb.list_specs({ metadata: { "kind": "test" }, spec: { "a": "A1" } });
        expect(res).not.toBeNull();
        expect(res[0]).not.toBeNull();
        expect(res.length).toBeGreaterThanOrEqual(1);
        // @ts-ignore
        expect(res[0][1].a).toEqual("A1");
        done();
    });
    test("Insert Status", async (done) => {
        const statusDb: Status_DB = await connection.get_status_db();
        const entity_ref: Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        const status: Status = { a: "A" };
        await statusDb.replace_status(entity_ref, status);
        done();
    });
    test("Update Status", async (done) => {
        const statusDb: Status_DB = await connection.get_status_db();
        const entity_ref: Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        const status: Status = { a: "A1" };
        await statusDb.replace_status(entity_ref, status);
        done();
    });
    test("Get Status", async (done) => {
        expect.assertions(3);
        const statusDb: Status_DB = await connection.get_status_db();
        const entity_ref: Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        const res = await statusDb.get_status(entity_ref);
        expect(res).not.toBeNull();
        if (res === null) {
            done.fail("Entity without status");
            return;
        }
        const [metadata, status] = res;
        expect(metadata.uuid).toEqual(entity_ref.uuid);
        expect(status.a).toEqual("A1");
        done();
    });
    test("Partially update Status", async (done) => {
        expect.assertions(4);
        const statusDb: Status_DB = await connection.get_status_db();
        const entity_ref: Entity_Reference = { uuid: entityA_uuid, kind: "test" };
        const initial_status: Status = { b: "A3" };
        await statusDb.update_status(entity_ref, initial_status);
        const res = await statusDb.get_status(entity_ref);
        expect(res).not.toBeNull();
        if (res === null) {
            done.fail("Entity without status");
            return;
        }
        const [metadata, status] = res;
        expect(metadata.uuid).toEqual(entity_ref.uuid);
        expect(status.a).toEqual("A1");
        expect(status.b).toEqual("A3");
        done();
    });
    test("Get Status for non existing entity should fail", async (done) => {
        expect.assertions(1);
        const statusDb: Status_DB = await connection.get_status_db();
        const entity_ref: Entity_Reference = { uuid: uuid4(), kind: "test" };
        try {
            await statusDb.get_status(entity_ref);
            done.fail();
        } catch (err) {
            expect(err).not.toBeNull();
            done();
        }
    });
    test("List Statuses", async (done) => {
        expect.assertions(1);
        const statusDb: Status_DB = await connection.get_status_db();
        const res = await statusDb.list_status({ metadata: { "kind": "test" } });
        expect(res.length).toBeGreaterThanOrEqual(1);
        done();
    });
    test("List Statuses - check status data", async (done) => {
        expect.assertions(3);
        const statusDb: Status_DB = await connection.get_status_db();
        const res = await statusDb.list_status({ metadata: { "kind": "test" }, status: { a: "A1" } });
        expect(res.length).toBeGreaterThanOrEqual(1);
        expect(res[0]).not.toBeNull();
        // @ts-ignore
        expect(res[0][1].a).toEqual("A1");
        done();
    });
    test("Register Provider", async (done) => {
        const providerDb: Provider_DB = await connection.get_provider_db();
        const test_kind = {} as Kind;
        const provider: Provider = { prefix: "test", version: "0.1.0", kinds: [test_kind], procedures: {}, extension_structure: {} };
        await providerDb.save_provider(provider);
        done();
    });
    test("Get provider", async (done) => {
        expect.assertions(2);
        const providerDb: Provider_DB = await connection.get_provider_db();
        const prefix_string: string = "test";
        const version: string = "0.1.0";
        const res = await providerDb.get_provider(prefix_string, version);
        expect(res.prefix).toBe(prefix_string);
        expect(res.version).toBe(version);
        done();
    });
    test("Get provider using his prefix", async (done) => {
        expect.assertions(2);
        const providerDb: Provider_DB = await connection.get_provider_db();
        const prefix_string: string = "test";
        const version: string = "0.1.0";
        const res = await providerDb.get_provider(prefix_string, version);
        expect(res.prefix).toBe(prefix_string);
        expect(res.version).toBe(version);
        done();
    });
    test("Get non-existing provider fail", async (done) => {
        expect.assertions(1);
        const providerDb: Provider_DB = await connection.get_provider_db();
        const prefix_string: string = "testFail";
        const version: string = "0.1.0";
        try {
            await providerDb.get_provider(prefix_string, version);
            done.fail();
        } catch (err) {
            expect(err).not.toBeNull();
            done();
        }
    });
    test("List Providers", async (done) => {
        expect.assertions(3);
        const providerDb: Provider_DB = await connection.get_provider_db();
        const res = await providerDb.list_providers();
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.length).toBeGreaterThanOrEqual(1);
        done();
    });
    test("Delete provider", async (done) => {
        const providerDb: Provider_DB = await connection.get_provider_db();
        const prefix_string: string = "test";
        const version: string = "0.1.0";
        await providerDb.delete_provider(prefix_string, version);
        done();
    });
});
