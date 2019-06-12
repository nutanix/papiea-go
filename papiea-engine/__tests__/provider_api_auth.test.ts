import "jest";
import axios from "axios";
import { ProviderBuilder } from "./test_data_factory";
import uuid = require("uuid");
import { Metadata, Spec, Provider } from "papiea-core";


declare var process: {
    env: {
        SERVER_PORT: string,
        ADMIN_S2S_KEY: string
    }
};
const serverPort = parseInt(process.env.SERVER_PORT || '3000');
const adminKey = process.env.ADMIN_S2S_KEY || '';

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

describe("Provider API auth tests", () => {
    const provider: Provider = new ProviderBuilder()
        .withVersion("0.1.0")
        .withKinds()
        .build();
    const kind_name = provider.kinds[0].name;
    const tenant_uuid = uuid();

    test("Admin should create s2s key for provider-admin", async done => {
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: provider.prefix,
                        is_provider_admin: true
                    }
                }
            );
            const { data: userInfo } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/user_info`,
                { headers: { 'Authorization': `Bearer ${s2skey.key}` } }
            );
            expect(userInfo.provider_prefix).toEqual(provider.prefix);
            expect(userInfo.is_provider_admin).toBeTruthy();
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Admin should create s2s key for provider-admin with key provided", async done => {
        try {
            const key = uuid();
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    key: key,
                    extension: {
                        provider_prefix: provider.prefix,
                        is_provider_admin: true
                    }
                }
            );
            expect(s2skey.key).toEqual(key);
            const { data: userInfo } = await providerApi.get(`/${provider.prefix}/${provider.version}/auth/user_info`,
                { headers: { 'Authorization': `Bearer ${s2skey.key}` } }
            );
            expect(userInfo.provider_prefix).toEqual(provider.prefix);
            expect(userInfo.is_provider_admin).toBeTruthy();
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Provider-admin should register and unregister provider", async done => {
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: provider.prefix,
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post('/', provider, {
                headers: { 'Authorization': `Bearer ${s2skey.key}` }
            });
            await providerApi.delete(`/${provider.prefix}/${provider.version}`, {
                headers: { 'Authorization': `Bearer ${s2skey.key}` }
            });
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Provider-admin should not register provider with another prefix", async done => {
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: uuid(),
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post('/', provider, {
                headers: { 'Authorization': `Bearer ${s2skey.key}` }
            });
            done.fail("Provider-admin should not register provider with another prefix");
        } catch (e) {
            done();
        }
    });

    test("Provider-admin should update status", async done => {
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: provider.prefix,
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post('/', provider, {
                headers: { 'Authorization': `Bearer ${s2skey.key}` }
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
            }, {
                    headers: { 'Authorization': `Bearer ${s2skey.key}` }
                });
            const newStatus = Object.assign({}, spec, { y: 12 })
            await providerApi.post('/update_status', {
                context: "some context",
                entity_ref: {
                    uuid: metadata.uuid,
                    kind: kind_name
                },
                status: newStatus
            }, {
                    headers: { 'Authorization': `Bearer ${s2skey.key}` }
                });
            await providerApi.delete(`/${provider.prefix}/${provider.version}`, {
                headers: { 'Authorization': `Bearer ${s2skey.key}` }
            });
            done();
        } catch (e) {
            done.fail(e);
        }
    });

    test("Provider-admin should not update status for provider with another prefix", async done => {
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: provider.prefix,
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post('/', provider, {
                headers: { 'Authorization': `Bearer ${s2skey.key}` }
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
            }, {
                    headers: { 'Authorization': `Bearer ${s2skey.key}` }
                });
            const newStatus = Object.assign({}, spec, { y: 12 })
            const data: any = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: uuid(),
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post('/update_status', {
                context: "some context",
                entity_ref: {
                    uuid: metadata.uuid,
                    kind: kind_name
                },
                status: newStatus
            }, {
                    headers: { 'Authorization': `Bearer ${data.s2skey.key}` }
                });
            done.fail("Provider-admin should not update status for provider with another prefix");
        } catch (e) {
            done();
        }
    });

    test("Provider-admin should not create s2s key for admin", async done => {
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: provider.prefix,
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: provider.prefix,
                        is_admin: true
                    }
                }, {
                    headers: { 'Authorization': `Bearer ${s2skey.key}` }
                }
            );
            done.fail("Provider-admin should not create s2s key for admin");
        } catch (e) {
            done();
        }
    });

    test("Provider-admin should not create s2s key for provider-admin", async done => {
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: provider.prefix,
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    extension: {
                        provider_prefix: provider.prefix,
                        is_provider_admin: true
                    }
                }, {
                    headers: { 'Authorization': `Bearer ${s2skey.key}` }
                }
            );
            done.fail("Provider-admin should not create s2s key for provider-admin");
        } catch (e) {
            done();
        }
    });

});