import "jest";
import axios from "axios";
import * as http from "http";
const url = require("url");
const queryString = require("query-string");
import { Metadata, Spec } from "../src/core";
import { Provider } from "../src/papiea";
import { ProviderBuilder } from "./test_data_factory";
import uuid = require("uuid");


declare var process: {
    env: {
        SERVER_PORT: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');

const entityApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/services`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

const providerApi = axios.create({
    baseURL: `http://127.0.0.1:${serverPort}/provider`,
    timeout: 1000,
    headers: { 'Content-Type': 'application/json' }
});

export function base64UrlEncode(...parts: any[]): string {
    function base64UrlEncodePart(data: any): string {
        return Buffer.from(JSON.stringify(data))
            .toString('base64')
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=+$/, '');
    }
    return parts.map(x => base64UrlEncodePart(x)).join('.');
}

describe("Entity API auth tests", () => {
    const oauth2ServerHost = '127.0.0.1';
    const oauth2ServerPort = 9002;
    const procedureCallbackHostname = "127.0.0.1";
    const procedureCallbackPort = 9001;
    const provider: Provider = new ProviderBuilder()
                                .withVersion("0.1.0")
                                .withKinds()
                                .withCallback(`http://${procedureCallbackHostname}:${procedureCallbackPort}`)
                                .withEntityProcedures()
                                .withKindProcedures()
                                .withProviderProcedures()
                                .withOAuth2Description()
                                .build();
    console.dir(provider);
    const kind_name = provider.kinds[0].name;
    let entity_metadata: Metadata, entity_spec: Spec;

    const tenant_uuid = uuid();
    const oauth2Server = http.createServer((req, res) => {
        if (req.method == 'GET') {
            const params = queryString.parse(url.parse(req.url).query);
            expect(params.client_id).toEqual('XXX');
            expect(params.scope).toEqual('openid');
            expect(params.response_type).toEqual('code');
            // expect(params.prompt).toEqual('login');
            const resp_query = queryString.stringify({
                state: params.state,
                code: 'ZZZ'
            });
            res.statusCode = 302;
            res.setHeader('Location', params.redirect_uri + '?' + resp_query);
            res.end();
        } else if (req.method == 'POST') {
            let body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                const params = queryString.parse(body);
                expect(params.client_id).toEqual('XXX');
                expect(params.client_secret).toEqual('YYY');
                expect(params.code).toEqual('ZZZ');
                expect(params.grant_type).toEqual('authorization_code');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    scope: 'openid',
                    token_type: 'Bearer',
                    expires_in: 3167,
                    refresh_token: uuid(),
                    id_token: base64UrlEncode(
                        {
                            "alg": "RS256",
                            "x5t": "AAA",
                            "kid": "BBB"
                        }, {
                            "azp": "EEE",
                            "sub": "alice",
                            "at_hash": "DDD",
                            "default_tenant": tenant_uuid,
                            "iss": "https:\/\/127.0.0.1:9002\/oauth2\/token",
                            "given_name": "Alice",
                            "iat": 1555926264,
                            "xi_role": base64UrlEncode([{
                                "tenant-domain": tenant_uuid,
                                "tenant-status": "PROVISIONED",
                                "tenant-name": "someTenant",
                                "roles": [{ "name": "account-admin" }, { "name": "papiea-admin" }],
                                "tenant-owner-email": "someTenant@localhost",
                                "account_approved": true,
                                "tenant-properties": {
                                    "sfdc-accountid": "xyztest",
                                    "tenant-uuid": tenant_uuid
                                }
                            }]),
                            "auth_time": 1555926264,
                            "exp": 1555940664,
                            "email": "alice@localhost",
                            "aud": ["EEE"],
                            "last_name": "Doe",
                            "role": ["COMMUNITY", "Internal\/everyone"],
                            "federated_idp": "local"
                        }),
                    access_token: base64UrlEncode(
                        {
                            "alg": "RS256"
                        },
                        {
                            "created_by": "papiea",
                            "azp": "EEE",
                            "sub": "alice",
                            "default_tenant": tenant_uuid,
                            "iss": "https:\/\/127.0.0.1:9002\/oauth2\/token",
                            "given_name": "Alice",
                            "iat": 1555925532,
                            "exp": 1555929132,
                            "email": "alice@localhost",
                            "last_name": "Doe",
                            "aud": ["EEE"],
                            "role": "COMMUNITY,Internal\/everyone",
                            "jti": uuid(),
                            "user_id": uuid()
                        }
                    )

                }));
            });
        }
    });

    beforeAll(async () => {
        await providerApi.post('/', provider);
        oauth2Server.listen(oauth2ServerPort, oauth2ServerHost, () => {
            console.log(`Server running at http://${oauth2ServerHost}:${oauth2ServerPort}/`);
        });
    });

    afterAll(async () => {
        await providerApi.delete(`/${provider.prefix}/${provider.version}`);
        oauth2Server.close();
    });

    beforeEach(async () => {
        await providerApi.post(`/${provider.prefix}/${provider.version}/auth`, {
            policy: null
        });
        const { data: { metadata, spec } } = await entityApi.post(`/${provider.prefix}/${provider.version}/${kind_name}`, {
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
        await providerApi.post(`/${provider.prefix}/${provider.version}/auth`, {
            policy: null
        });
        await entityApi.delete(`/${provider.prefix}/${provider.version}/${kind_name}/${entity_metadata.uuid}`);
    });

    test("Get user info", async done => {
        try {
            const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
            const { data } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/user_info`,
                { headers: { 'Authorization': 'Bearer ' + token } }
            );
            expect(data.owner).toEqual("alice");
            expect(data.tenant).toEqual(tenant_uuid);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Login from SPA", async done => {
        try {
            const hostname = "127.0.0.1";
            const port = 9003;
            const server = http.createServer((req, res) => {
                if (req.method == 'GET') {
                    const token = queryString.parse(url.parse(req.url).query).token;
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ token }));
                    server.close();
                }
            });
            server.listen(port, hostname, () => {
                console.log(`Server running at http://${hostname}:${port}/`);
            });
            const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login?redirect_uri=http://${hostname}:${port}/`);
            const { data } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/user_info`,
                { headers: { 'Authorization': 'Bearer ' + token } }
            );
            expect(data.owner).toEqual("alice");
            expect(data.tenant).toEqual(tenant_uuid);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Get entity should raise permission denied", async done => {
        try {
            const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
            await providerApi.post(`/${provider.prefix}/${provider.version}/auth`, {
                policy: `p, bill, owner, ${kind_name}, *, allow`
            });
            await entityApi.get(`/${provider.prefix}/${provider.version}/${kind_name}/${entity_metadata.uuid}`,
                { headers: { 'Authorization': 'Bearer ' + token } }
            );
            done.fail();
        } catch (e) {
            expect(e.response.status).toEqual(403);
            done();
        }
    });

    test("Get entity should succeed after policy set", async done => {
        try {
            const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
            await providerApi.post(`/${provider.prefix}/${provider.version}/auth`, {
                policy: `p, alice, owner, ${kind_name}, *, allow`
            });
            const { data: { metadata, spec } } = await entityApi.get(`/${provider.prefix}/${provider.version}/${kind_name}/${entity_metadata.uuid}`,
                { headers: { 'Authorization': 'Bearer ' + token } }
            );
            expect(metadata).toEqual(entity_metadata);
            expect(spec).toEqual(entity_spec);
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Get entity of another provider should raise unauthorized", async done => {
        try {
            const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
            await entityApi.get(`/${provider.prefix}1/${provider.version}/${kind_name}/${entity_metadata.uuid}`,
                { headers: { 'Authorization': 'Bearer ' + token } }
            );
            done.fail();
        } catch (e) {
            expect(e.response.status).toEqual(401);
            done();
        }
    });

    test("Entity procedure should receive headers", async (done) => {
        let headers: any = {};
        const server = http.createServer((req, res) => {
            if (req.method == 'POST') {
                Object.assign(headers, req.headers);
                let body = '';
                req.on('data', function (data) {
                    body += data;
                });
                req.on('end', function () {
                    const post = JSON.parse(body);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(JSON.stringify(post.spec));
                    server.close();
                });
            }
        });
        server.listen(procedureCallbackPort, procedureCallbackHostname, () => {
            console.log(`Server running at http://${procedureCallbackHostname}:${procedureCallbackPort}/`);
        });
        const { data: { token } } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/login`);
        await providerApi.post(`/${provider.prefix}/${provider.version}/auth`, {
            policy: `p, alice, owner, ${kind_name}, *, allow`
        });
        await entityApi.post(`/${provider.prefix}/${provider.version}/${kind_name}/${entity_metadata.uuid}/procedure/moveX`, { input: 5 },
            { headers: { 'Authorization': 'Bearer ' + token } }
        );
        done();
    });
});