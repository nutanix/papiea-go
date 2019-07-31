import 'jest'
import { deref, parseJwt } from '../../src/auth/user_data_evaluator'
import * as _ from "lodash"
import { loadYaml } from "../test_data_factory";
import uuid = require("uuid");
import btoa = require("btoa");

function base64UrlEncode(...parts: any[]): string {
    function base64UrlEncodePart(data: any): string {
        return Buffer.from(JSON.stringify(data))
            .toString('base64')
            .replace('+', '-')
            .replace('/', '_')
            .replace(/=+$/, '');
    }
    return parts.map(x => base64UrlEncodePart(x)).join('.');
}

const tenant_uuid = uuid();

const id_token = base64UrlEncode(
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
    });

const access_token_identity_part = {
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
};

const access_token = base64UrlEncode(
    {
        "alg": "RS256"
    },
    access_token_identity_part
);

const token =
    {
        token:
            {
                scope: 'openid',
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_token: '93b3ebdc-8ac6-3181-ab78-42c22a48e345',
                id_token: id_token,
                access_token: access_token,
                expires_at: "now"
            }
    };

describe("ParseJwt", () => {
    test("no token", (done) => {
        expect(parseJwt("")).toEqual({ header: {}, content: {} });
        done()
    });

    test("empty token", (done) => {
        expect(parseJwt(".")).toEqual({ header: {}, content: {} });
        done()
    });

    test("parse valid token", (done) => {
        expect(parseJwt(token.token.access_token)).toEqual(
            {
                "content": access_token_identity_part,
                "header": {
                    "alg": "RS256",
                },
            }
        );
        done()
    })
});

// Todo(Shlomi): the following tests non-exported functions, we should use rewire or something

//describe("Validating getters", ()=>{
//    test("get_reference should fail on non-references", done=>{
//        try {
//            get_reference("no-reference")
//            done.fail("Error not thrown")
//        } catch (err) {
//            expect(err.message).toEqual(`'no-reference' not a reference.`)
//            done()
//        }
//    })
//    
//})

describe("Test deref", () => {
    test("direct", done => {
        let env = { 'g': 'q' };
        expect(deref(env, '^g')).toEqual('q');
        done()
    });

    test("single reference", done => {
        let env = { 'a': { 'q': 2 }, 'b': '^a' };
        expect(deref(env, '^b')).toEqual({ 'q': 2 });
        expect(deref(env, '^b.q')).toEqual(2);
        done()
    });

    test("multiple references", done => {
        let env = { 'a': { 'q': 2 }, 'b': '^a', 'g': '^b', 'q': '^g' };
        expect(deref(env, '^q')).toEqual({ 'q': 2 });
        expect(deref(env, '^q.q')).toEqual(2);
        done()
    });

    test("deref should memoize", done => {
        let env = { 'a': { 'q': 2 }, 'b': '^a', 'g': '^b', 'q': '^g' };
        deref(env, '^q');
        expect(env).toEqual({ "a": { "q": 2 }, "b": { "q": 2 }, "g": { "q": 2 }, "q": { "q": 2 } });
        done()
    });

    test("deref on non-reference returns the input", done => {
        let env = {};
        expect(deref(env, 'no-reference')).toEqual('no-reference');
        done()
    });

    test("deref on invalid variable should throw an error", done => {
        let env = {};
        try {
            deref(env, '^none');
            done.fail("Error not thrown")
        } catch (err) {
            expect(err.message).toEqual(`Variable, index or key 'none' not found`);
            done()
        }
    });

    test("deref with find without args", done => {
        let env = { t: 't' };
        try {
            deref(env, '^t.$find');
            done.fail("Error not thrown")
        } catch (err) {
            expect(err.message).toEqual("no params found for 'find' function");
            done()
        }
    });

    test("deref with find with bad args", done => {
        let env = { t: 't' };
        try {
            let a = deref(env, '^t.$find(asdasd)');
            done.fail("Error not thrown")
        } catch (err) {
            expect(err.message)
                .toEqual(`bad params found for 'find' function. asdasd`);
            done()
        }
    });

    test("deref on token", done => {
        let env = { token: token.token };
        expect(deref(env, "^token.scope")).toEqual("openid");
        expect(deref(env, "^token.id_token.$JWT.content.given_name")).toEqual("Alice");
        expect(deref(env, "^token.id_token.$JWT.content.xi_role.$JWT.header.0.roles.1.name")).toEqual("papiea-admin");
        done()
    });

    test("deref on function first with ref as parameter", done => {
        let env = { token: token.token };
        expect(deref(env, "$bearer(^token.access_token)")).toEqual(`Bearer ${ btoa(JSON.stringify(token.token.access_token)) }`);
        done();
    });

    test("deref on function first without ref as parameter", done => {
        let env = { token: token.token };
        expect(deref(env, "$bearer(abcd)")).toEqual(`Bearer abcd`);
        done();
    });

    test("deref a reference without nested path", done => {
        let env = { token: token.token };
        expect(deref(env, "^token")).toEqual(token.token);
        done();
    });

    test("deref a reference without nested path with bearer function", done => {
        let env = { token: token.token };
        expect(deref(env, "$bearer(^token)")).toEqual(`Bearer ${btoa(JSON.stringify(token.token))}`);
        done();
    })
});

describe("Evaluating a full yaml file", () => {
    const doc = loadYaml("./test_data/auth.yaml");

    const headers = doc.oauth.user_info.headers;
    let env = _.omit(doc.oauth.user_info, ['headers']);

    // Insert the token into the enviroment
    env.token = token.token;

    test("Headers", (done) => {
        try {

            //evaluate headers
            const the_headers = _.mapValues(headers, (v: any) => deref(env, v));
            expect(the_headers).toEqual(
                {
                    "tenant-email": "alice@localhost",
                    "tenant": tenant_uuid,
                    "tenant-fname": "Alice",
                    "tenant-lname": "Doe",
                    "tenant-role": "papiea-admin",
                    "authorization": `Bearer ${ btoa(JSON.stringify(token.token)) }`,
                    "owner": "alice"
                });
            done()
        } catch (e) {
            done.fail(e)
        }
    })
});
