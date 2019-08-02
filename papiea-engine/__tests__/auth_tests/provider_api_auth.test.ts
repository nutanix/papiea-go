import "jest";
import axios from "axios";
import { ProviderBuilder } from "../test_data_factory";
import uuid = require("uuid");
import { Provider } from "papiea-core";


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

    test("Admin should create s2s key for provider-admin", async () => {
        jest.setTimeout(5000);
        expect.hasAssertions();
        const { data: s2skey } = await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                userInfo: {
                    is_provider_admin: true
                }
            }
        );
        const { data: userInfo } = await providerApi.get(`/${ provider.prefix }/${ provider.version }/auth/user_info`,
            { headers: { 'Authorization': `Bearer ${ s2skey.key }` } }
        );
        expect(userInfo.provider_prefix).toEqual(provider.prefix);
        expect(userInfo.is_provider_admin).toBeTruthy();
    });

    test("Admin should create s2s key for provider-admin with key provided", async () => {
        jest.setTimeout(5000);
        expect.hasAssertions();
        const key = uuid();
        const { data: s2skey } = await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                key: key,
                userInfo: {
                    is_provider_admin: true
                }
            }
        );
        expect(s2skey.key).toEqual(key);
        const { data: userInfo } = await providerApi.get(`/${ provider.prefix }/${ provider.version }/auth/user_info`,
            { headers: { 'Authorization': `Bearer ${ s2skey.key }` } }
        );
        expect(userInfo.provider_prefix).toEqual(provider.prefix);
        expect(userInfo.is_provider_admin).toBeTruthy();
    });

    test("Provider-admin should register and unregister provider", async () => {
        const { data: s2skey } = await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                userInfo: {
                    is_provider_admin: true
                }
            }
        );
        await providerApi.post('/', provider, {
            headers: { 'Authorization': `Bearer ${ s2skey.key }` }
        });
        await providerApi.delete(`/${ provider.prefix }/${ provider.version }`, {
            headers: { 'Authorization': `Bearer ${ s2skey.key }` }
        });
    });

    test("Provider-admin should not register provider with another prefix", async () => {
        expect.hasAssertions();
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    userInfo: {
                        provider_prefix: uuid(),
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post('/', provider, {
                headers: { 'Authorization': `Bearer ${s2skey.key}` }
            });
            throw new Error("Provider-admin should not register provider with another prefix");
        } catch (e) {
            expect(e.response.status).toEqual(400);
        }
    });

    test("Provider-admin should update status", async () => {
        const { data: s2skey } = await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                userInfo: {
                    is_provider_admin: true
                }
            }
        );
        await providerApi.post('/', provider, {
            headers: { 'Authorization': `Bearer ${ s2skey.key }` }
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
        }, {
            headers: { 'Authorization': `Bearer ${ s2skey.key }` }
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
            headers: { 'Authorization': `Bearer ${ s2skey.key }` }
        });
        await providerApi.delete(`/${ provider.prefix }/${ provider.version }`, {
            headers: { 'Authorization': `Bearer ${ s2skey.key }` }
        });
    });

    test("Provider-admin should not update status for provider with another prefix", async () => {
        expect.hasAssertions();
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    name: "ProviderAdminStatus",
                    userInfo: {
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post('/', provider, {
                headers: { 'Authorization': `Bearer ${s2skey.key}` }
            });
            const { data: { metadata, spec } } = await entityApi.post(`/${provider.prefix}/${provider.version}/${kind_name}`, {
                metadata: {
                    userInfo: {
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
            const { data } = await providerApiAdmin.post(`/${uuid()}/${provider.version}/s2skey`,
                {
                    userInfo: {
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
                    headers: { 'Authorization': `Bearer ${data.key}` }
                });
            throw new Error("Provider-admin should not update status for provider with another prefix");
        } catch (e) {
            expect(e.response.status).toEqual(403);
        }
    });

    test("Provider-admin should not create s2s key for admin", async () => {
        expect.hasAssertions();
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    userInfo: {
                        owner: "admin@provider",
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    owner: "admin@provider",
                    userInfo: {
                        owner: "anotheradmin@provider",
                        is_admin: true
                    }
                }, {
                    headers: { 'Authorization': `Bearer ${s2skey.key}` }
                }
            );
            throw new Error("Provider-admin should not create s2s key for admin");
        } catch (e) {
            expect(e.response.status).toEqual(403);
        }
    });

    test("Provider-admin should not create s2s key with another provider prefix", async () => {
        expect.hasAssertions();
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    userInfo: {
                        owner: "admin@provider",
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    owner: "admin@provider",
                    userInfo: {
                        owner: "admin@provider",
                        provider_prefix: provider.prefix + "1"
                    }
                }, {
                    headers: { 'Authorization': `Bearer ${s2skey.key}` }
                }
            );
            throw new Error("Provider-admin should not create s2s key for provider-admin");
        } catch (e) {
            expect(e.response.status).toEqual(400);
        }
    });

    test("Provider-admin should create s2s key for another provider-admin", async () => {
        const { data: s2skey } = await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                userInfo: {
                    owner: "admin@provider",
                    is_provider_admin: true
                }
            }
        );
        await providerApi.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                owner: "admin@provider",
                userInfo: {
                    owner: "anotheradmin@provider",
                    is_provider_admin: true
                }
            }, {
                headers: { 'Authorization': `Bearer ${ s2skey.key }` }
            }
        );
    });

    test("Provider-admin should create s2s key for provider-user", async () => {
        const { data: s2skey } = await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                userInfo: {
                    owner: "admin@provider",
                    is_provider_admin: true
                }
            }
        );
        await providerApi.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                owner: "admin@provider",
                userInfo: {
                    owner: "user@provider",
                }
            }, {
                headers: { 'Authorization': `Bearer ${ s2skey.key }` }
            }
        );
    });

    test("Provider-admin should not create s2s key for provider-user with provider-user owner", async () => {
        expect.hasAssertions();
        try {
            const { data: s2skey } = await providerApiAdmin.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    userInfo: {
                        owner: "admin@provider",
                        is_provider_admin: true
                    }
                }
            );
            await providerApi.post(`/${provider.prefix}/${provider.version}/s2skey`,
                {
                    owner: "user@provider",
                    userInfo: {
                        owner: "user@provider"
                    }
                }, {
                    headers: { 'Authorization': `Bearer ${s2skey.key}` }
                }
            );
            throw new Error("Provider-admin should not create s2s key for provider-user with provider-user owner");
        } catch (e) {
            expect(e.response.status).toEqual(403);
        }
    });

    test("Provider-user should list only his s2s keys", async () => {
        expect.hasAssertions();
        const { data: s2skey } = await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                owner: "user1@provider",
                userInfo: {
                    owner: "user1@provider"
                }
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                owner: "user2@provider",
                userInfo: {
                    owner: "user2@provider"
                }
            }
        );
        const { data } = await providerApi.get(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                headers: { 'Authorization': `Bearer ${ s2skey.key }` }
            }
        );
        expect(data.length).toEqual(1);
        expect(data[0].owner).toEqual("user1@provider");
    });

    test("Provider-admin should list only his s2s keys not including provider-users", async () => {
        expect.hasAssertions();
        const { data: s2skey } = await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                owner: "admin123@provider",
                userInfo: {
                    owner: "admin123@provider",
                    is_provider_admin: true
                }
            }
        );
        await providerApiAdmin.post(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                owner: "user2@provider",
                userInfo: {
                    owner: "user2@provider"
                }
            }
        );
        const { data } = await providerApi.get(`/${ provider.prefix }/${ provider.version }/s2skey`,
            {
                headers: { 'Authorization': `Bearer ${ s2skey.key }` }
            }
        );
        expect(data.length).toEqual(1);
        expect(data[0].owner).toEqual("admin123@provider");
    });

});