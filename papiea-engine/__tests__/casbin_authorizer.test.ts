import "jest"
import { UserAuthInfo } from "../src/auth/authn";
import { PermissionDeniedError, Action, ReadAction, CreateAction, UpdateAction, DeleteAction } from "../src/auth/authz";
import { CasbinAuthorizer } from "../src/auth/casbin";
import { resolve } from "path";


describe("Casbin authorizer tests", () => {
    const pathToModel: string = resolve(__dirname, "../src/auth/default_provider_model.txt");
    const pathToPolicy: string = resolve(__dirname, "../src/auth/provider_policy_example.txt");
    const authorizer = new CasbinAuthorizer(pathToModel, pathToPolicy);

    beforeAll(async () => {
        await authorizer.init();
    });

    afterAll(async () => {
    });

    function actionShouldFail(user: UserAuthInfo, object: any, action: Action, done: any) {
        authorizer.checkPermission(user, object, action).then(_ => {
            done.fail();
        }).catch(e => {
            if (e.constructor === PermissionDeniedError) {
                done();
            } else {
                done.fail(e);
            }
        });
    }

    function actionShouldSucceed(user: UserAuthInfo, object: any, action: Action, done: any) {
        authorizer.checkPermission(user, object, action).then(_ => {
            done();
        }).catch(e => {
            done.fail(e);
        });
    }

    test("Alice fails to write an imaged host of another user without rights", done => {
        actionShouldFail(
            { "owner": "alice", "tenant": "1" },
            { "metadata": { "extension": { "owner": "1alice1" }, "kind": "imaged_host" } },
            CreateAction,
            done
        );
    });

    test("Alice fails to delete her own imaged_host, which is explicitly denied", done => {
        actionShouldFail(
            { "owner": "alice", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Alice succeeds reading her own imaged host which is explicitly allowed", done => {
        actionShouldSucceed(
            { "owner": "alice", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "imaged_host" } },
            ReadAction,
            done
        );
    });

    test("Bob succeeds reading alice's geolocation, which is allowed to read by everyone using the default 'reader_group'", done => {
        actionShouldSucceed(
            { "owner": "bob", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "geolocation" } },
            ReadAction,
            done
        );
    });

    test("Bob fails to delete a geolocation since no rule allows for it", done => {
        actionShouldFail(
            { "owner": "bob", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "geolocation" } },
            DeleteAction,
            done
        );
    });

    test("Alice succeeds reading a host_type owned by her since it was explicitly allowed", done => {
        actionShouldSucceed(
            { "owner": "alice", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "host_type" } },
            ReadAction,
            done
        );
    });

    test("Bill succeeds reading alice's host_type since the reader_group allows it for everyone", done => {
        actionShouldSucceed(
            { "owner": "bill", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "host_type" } },
            ReadAction,
            done
        );
    });

    test("Bill fails deleting alice's host_type, since no rule allows it", done => {
        actionShouldFail(
            { "owner": "bill", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "host_type" } },
            DeleteAction,
            done
        );
    });

    test("Bill fails deleting alice's imaged_type, since the standard_group only allows deleting to owners", done => {
        actionShouldFail(
            { "owner": "bill", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Bill succeeds deleting his own imaged_type, since the standard_group only allows deleting to owners", done => {
        actionShouldSucceed(
            { "owner": "bill", "tenant": "1" },
            { "metadata": { "extension": { "owner": "bill" }, "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Anonymous user is denied reading alice's host_type, by a rule denying anything of anyone's entity", done => {
        actionShouldFail(
            { "owner": "anonymous" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "host_type" } },
            ReadAction,
            done
        );
    });

    test("Admin can delete alice's imaged_host since admin belongs to the admin's group", done => {
        actionShouldSucceed(
            { "owner": "admin" },
            { "metadata": { "extension": { "owner": "alice" }, "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Rick can delete alice's imaged_host since he is in her tenant and is a part of tenant_group", done => {
        actionShouldSucceed(
            { "owner": "rick", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice", "tenant_uuid": "1" }, "kind": "imaged_host" } },
            DeleteAction,
            done
        );
    });

    test("Rick fails to delete alice's imaged_cluster since he is in her tenant and is a part of tenant_group but the rule denies deleteing", done => {
        actionShouldFail(
            { "owner": "rick", "tenant": "1" },
            { "metadata": { "extension": { "owner": "alice", "tenant_uuid": "1" }, "kind": "imaged_cluster" } },
            DeleteAction,
            done
        );
    });
});