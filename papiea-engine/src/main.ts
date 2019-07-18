import * as express from "express";
import createAPIDocsRouter from "./api_docs/api_docs_routes";
import ApiDocsGenerator from "./api_docs/api_docs_generator";
import createProviderAPIRouter from "./provider/provider_routes";
import { Provider_API_Impl } from "./provider/provider_api_impl";
import { MongoConnection } from "./databases/mongo";
import { createEntityAPIRouter } from "./entity/entity_routes";
import { Entity_API_Impl, ProcedureInvocationError } from "./entity/entity_api_impl";
import { ValidationError, Validator } from "./validator";
import { EntityNotFoundError } from "./databases/utils/errors";
import { UnauthorizedError, createAuthnRouter } from "./auth/authn";
import { createOAuth2Router } from "./auth/oauth2";
import { JWTHMAC } from "./auth/crypto";
import { Authorizer, AdminAuthorizer, PerProviderAuthorizer, PermissionDeniedError } from "./auth/authz";
import { ProviderCasbinAuthorizerFactory } from "./auth/casbin";
import morgan = require("morgan");

declare var process: {
    env: {
        SERVER_PORT: string,
        MONGO_DB: string,
        TOKEN_SECRET: string,
        TOKEN_EXPIRES_SECONDS: string,
        MONGO_HOST: string,
        MONGO_PORT: string
        PAPIEA_PUBLIC_ADDR: string,
        DEBUG_LEVEL: string,
        ADMIN_S2S_KEY: string,
        DISALLOW_EXTRA_PROPERTIES: string
    },
    title: string;
};
process.title = "papiea";
const serverPort = parseInt(process.env.SERVER_PORT || "3000");
const tokenSecret = process.env.TOKEN_SECRET || "secret";
const debugLevel = process.env.DEBUG_LEVEL || "common";
const tokenExpiresSeconds = parseInt(process.env.TOKEN_EXPIRES_SECONDS || (60 * 60 * 24 * 7).toString());
const publicAddr: string = process.env.PAPIEA_PUBLIC_ADDR || "http://localhost:3000";
const oauth2RedirectUri: string = publicAddr + "/provider/auth/callback";
const mongoHost = process.env.MONGO_HOST || 'mongo';
const mongoPort = process.env.MONGO_PORT || '27017';
const adminKey = process.env.ADMIN_S2S_KEY || '';
const disallowExtraProps = process.env.DISALLOW_EXTRA_PROPERTIES !== "false";

async function setUpApplication(): Promise<express.Express> {
    const app = express();
    app.use(express.json());
    app.use(morgan(debugLevel));
    const mongoConnection: MongoConnection = new MongoConnection(`mongodb://${mongoHost}:${mongoPort}`, process.env.MONGO_DB || 'papiea');
    await mongoConnection.connect();
    const providerDb = await mongoConnection.get_provider_db();
    const specDb = await mongoConnection.get_spec_db();
    const statusDb = await mongoConnection.get_status_db();
    const s2skeyDb = await mongoConnection.get_s2skey_db();
    const providerApi = new Provider_API_Impl(providerDb, statusDb, s2skeyDb, new AdminAuthorizer());
    const signature = new JWTHMAC(tokenSecret, tokenExpiresSeconds);
    app.use(createAuthnRouter(adminKey, signature, s2skeyDb));
    app.use(createOAuth2Router(oauth2RedirectUri, signature, providerDb));
    const entityApiAuthorizer: Authorizer = new PerProviderAuthorizer(providerApi, new ProviderCasbinAuthorizerFactory());
    app.use('/provider', createProviderAPIRouter(providerApi));
    app.use('/services', createEntityAPIRouter(new Entity_API_Impl(statusDb, specDb, providerApi, entityApiAuthorizer)));
    app.use('/api-docs', createAPIDocsRouter('/api-docs', new ApiDocsGenerator(providerDb)));
    app.use(function (err: any, req: any, res: any, next: any) {
        if (res.headersSent) {
            return next(err);
        }
        switch (err.constructor) {
            case ValidationError:
                res.status(400);
                res.json({ errors: err.errors });
                return;
            case ProcedureInvocationError:
                res.status(err.status);
                res.json({ errors: err.errors });
                return;
            case EntityNotFoundError:
                res.status(404);
                res.json({ error: `Entity with kind: ${err.kind}, uuid: ${err.uuid} not found` });
                return;
            case UnauthorizedError:
                res.status(401);
                res.json({ error: 'Unauthorized' });
                return;
            case PermissionDeniedError:
                res.status(403);
                res.json({ error: 'Forbidden' });
                return;
            default:
                res.status(500);
                console.error(err);
                res.json({ error: `${err}` });
        }
    });
    return app;
}

setUpApplication().then(app => {
    app.listen(serverPort, function () {
        console.log(`Papiea app listening on port ${serverPort}!`);
    });
}).catch(console.error);
