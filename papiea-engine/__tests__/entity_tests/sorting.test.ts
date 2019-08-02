import { getLocationDataDescription } from "../test_data_factory";
import axios from "axios";
import { UserAuthInfo } from "../../src/auth/authn";
import { Authorizer } from "../../src/auth/authz";
import { ProviderSdk } from "papiea-sdk";
import { Action } from "papiea-core";
import { createLogger } from "../../src/logger";
import * as winston from "winston";


declare var process: {
    env: {
        SERVER_PORT: string,
        ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.ADMIN_S2S_KEY || '';
const papieaUrl = `http://127.0.0.1:${serverPort}`;

class MockedAuthorizer extends Authorizer {
    async checkPermission(user: UserAuthInfo, object: any, action: Action): Promise<void> {
        const random_boolean = Math.random() >= 0.5;
        if (random_boolean) {
            throw new Error("Not authorized")
        }
    }
}

const server_config = {
    host: "127.0.0.1",
    port: 9000
};

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

describe("Pagination tests", () => {
    const providerPrefix = "test";
    const providerVersion = "0.1.0";
    const locationDataDescription = getLocationDataDescription();
    const kind_name = Object.keys(locationDataDescription)[0];

    let uuids: string[] = [];
    const entityPromises: Promise<any>[] = [];
    let sortingTestLogger: winston.Logger;

    beforeAll(async () => {
        sortingTestLogger = await createLogger("info", "sorting_test.log");
        const sdk = ProviderSdk.create_provider(papieaUrl, adminKey, server_config.host, server_config.port);
        sdk.new_kind(locationDataDescription);
        sdk.version(providerVersion);
        sdk.prefix(providerPrefix);
        await sdk.register();

        try {
            for (let i = 0; i < 70; i++) {
                entityPromises.push(entityApi.post(`/${providerPrefix}/${providerVersion}/${kind_name}`, {
                    spec: {
                        x: i,
                        y: 11
                    }
                }));
            }
            const entityResponses: any[] = await Promise.all(entityPromises);
            uuids = entityResponses.map(entityResp => entityResp.data.metadata.uuid);
            expect(entityResponses.length).toBe(70);
        } catch (e) {
            throw e;
        }
    }, 5000);

    afterAll(async () => {
        const deletePromises: Promise<any>[] = [];
        await axios.delete(`http://127.0.0.1:${serverPort}/provider/${providerPrefix}/${providerVersion}`);
        try {
            uuids.forEach(uuid => {
                deletePromises.push(entityApi.delete(`/${providerPrefix}/${providerVersion}/${kind_name}/${uuid}`));
            });
            await Promise.all(deletePromises);
        } catch (e) {
            throw e;
        }
    }, 5000);

    test("Sorting with no explicit order should be ascending", async (done) => {
        try {
            const { data } = await entityApi.post(`${providerPrefix}/${providerVersion}/${kind_name}/filter?sort=spec.x`, {
                spec: {
                    y: 11
                }
            });
            sortingTestLogger.info(data.results[0]);
            expect(data.results[0].spec.x).toBe(0);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Authorizer doesn't affect the order of sorting", async () => {
        const authorizer = new MockedAuthorizer();
        const specs = [{spec: {x: 10, y: 11}}, {spec: {x: 18, y:27}}, {spec: {x: 22, y: 8}}, {spec: {x: 41, y: 50}}];
        const res = await authorizer.filter({} as UserAuthInfo, specs, {} as Action);
        for (let i = 0; i < res.length - 1; i++) {
            expect(res[i+1].spec.x).toBeGreaterThan(res[i].spec.x)
        }
    })
});