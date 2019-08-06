import * as express from "express";
import createAPIDocsRouter from "./api_docs/api_docs_routes";
import ApiDocsGenerator from "./api_docs/api_docs_generator";
import createProviderAPIRouter from "./provider/provider_routes";
import { Provider_API_Impl } from "./provider/provider_api_impl";
import { MongoConnection } from "./databases/mongo";
import { createEntityAPIRouter } from "./entity/entity_routes";
import { Entity_API_Impl } from "./entity/entity_api_impl";
import {
    createAuthnRouter, CompositeUserAuthInfoExtractor, AdminUserAuthInfoExtractor
} from "./auth/authn";
import { createOAuth2Router, IdpUserAuthInfoExtractor } from "./auth/oauth2";
import { S2SKeyUserAuthInfoExtractor } from "./auth/s2s";
import { Authorizer, AdminAuthorizer, PerProviderAuthorizer } from "./auth/authz";
import { ValidatorImpl } from "./validator";
import { ProviderCasbinAuthorizerFactory } from "./auth/casbin";
import morgan = require("morgan");
import { PapieaErrorImpl } from "./errors/papiea_error_impl";

declare var process: {
    env: {
        SERVER_PORT: string,
        MONGO_DB: string,
        MONGO_HOST: string,
        MONGO_PORT: string
        PAPIEA_PUBLIC_ADDR: string,
        DEBUG_LEVEL: string,
        ADMIN_S2S_KEY: string
    },
    title: string;
};
process.title = "papiea";
const serverPort = parseInt(process.env.SERVER_PORT || "3000");
const debugLevel = process.env.DEBUG_LEVEL || "common";
const publicAddr: string = process.env.PAPIEA_PUBLIC_ADDR || "http://localhost:3000";
const oauth2RedirectUri: string = publicAddr + "/provider/auth/callback";
const mongoHost = process.env.MONGO_HOST || 'mongo';
const mongoPort = process.env.MONGO_PORT || '27017';
const adminKey = process.env.ADMIN_S2S_KEY || '';

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
    const validator = new ValidatorImpl()
    const providerApi = new Provider_API_Impl(providerDb, statusDb, s2skeyDb, new AdminAuthorizer(), validator);
    const userAuthInfoExtractor = new CompositeUserAuthInfoExtractor([
        new AdminUserAuthInfoExtractor(adminKey),
        new S2SKeyUserAuthInfoExtractor(s2skeyDb),
        new IdpUserAuthInfoExtractor(providerDb)
    ]);
    app.use(createAuthnRouter(userAuthInfoExtractor));
    app.use(createOAuth2Router(oauth2RedirectUri, providerDb));
    const entityApiAuthorizer: Authorizer = new PerProviderAuthorizer(providerApi, new ProviderCasbinAuthorizerFactory());
    app.use('/provider', createProviderAPIRouter(providerApi));
    app.use('/services', createEntityAPIRouter(new Entity_API_Impl(statusDb, specDb, providerApi, entityApiAuthorizer, validator)));
    app.use('/api-docs', createAPIDocsRouter('/api-docs', new ApiDocsGenerator(providerDb)));
    app.use(function (err: any, req: any, res: any, next: any) {
        if (res.headersSent) {
            return next(err);
        }
        const papieaError = PapieaErrorImpl.create(err);
        res.status(papieaError.status)
        res.json(papieaError.toResponse())
    });
    return app;
}

setUpApplication().then(app => {
    app.listen(serverPort, function () {
        console.log(`Papiea app listening on port ${serverPort}!`);
    });
}).catch(console.error);
