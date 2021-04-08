import * as express from "express";

import {
    logLevelFromString,
    LoggerFactory,
    getTracer,
    getTracingMiddleware
} from "papiea-backend-utils"

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
import { createOAuth2Router } from "./auth/oauth2";
import { S2SKeyUserAuthInfoExtractor } from "./auth/s2s";
import { Authorizer, AdminAuthorizer, PerProviderAuthorizer, IntentWatcherAuthorizer } from "./auth/authz";
import { ValidatorImpl } from "./validator";
import { ProviderCasbinAuthorizerFactory } from "./auth/casbin";
import { PapieaErrorResponseImpl } from "./errors/papiea_error_impl";
import { SessionKeyAPI, SessionKeyUserAuthInfoExtractor } from "./auth/session_key"
import { IntentfulContext } from "./intentful_core/intentful_context"
import { AuditLogger } from "./audit_logging"
import { BasicDiffer } from "./intentful_core/differ_impl"
import { getConfig } from "./utils/arg_parser"
import {getPapieaVersion, getVersionVerifier} from "./utils/utils"
const cookieParser = require('cookie-parser');

process.title = "papiea"
const config = getConfig()
const serverPort = config.server_port
const publicAddr = config.public_addr
const oauth2RedirectUri: string = publicAddr + "/provider/auth/callback"
const mongoUrl = config.mongo_url
const mongoDb = config.mongo_db
const adminKey = config.admin_key
const loggingLevel = logLevelFromString(config.logging_level)
const papieaDebug = config.debug
const verbosityOptions = config.logging_verbosity
const prettyPrint = config.pretty_print
const tracingConfig = config.tracing_config

async function setUpApplication(): Promise<express.Express> {
    const logger = LoggerFactory.makeLogger({level: loggingLevel, verbosity_options: verbosityOptions, pretty_print: prettyPrint});
    const tracer = getTracer("papiea-engine", logger, tracingConfig.reporter, tracingConfig.sampler, tracingConfig.logMessages)
    const trace = getTracingMiddleware(tracer)
    const auditLogger: AuditLogger = new AuditLogger(logger, papieaDebug)
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(auditLogger.middleware());
    const mongoConnection: MongoConnection = new MongoConnection(mongoUrl, mongoDb, logger);
    await mongoConnection.connect();
    const differ = new BasicDiffer()
    const providerDb = await mongoConnection.get_provider_db(logger);
    const specDb = await mongoConnection.get_spec_db(logger);
    const statusDb = await mongoConnection.get_status_db(logger);
    const s2skeyDb = await mongoConnection.get_s2skey_db(logger);
    const intentWatcherDB = await mongoConnection.get_intent_watcher_db(logger)
    const sessionKeyDb = await mongoConnection.get_session_key_db(logger)
    const watchlistDb = await mongoConnection.get_watchlist_db(logger)
    const graveyardDb = await mongoConnection.get_graveyard_db(logger)
    const validator = ValidatorImpl.create(logger)
    const entityApiAuthorizer: PerProviderAuthorizer = new PerProviderAuthorizer(logger, new ProviderCasbinAuthorizerFactory(logger));
    const adminAuthorizer: Authorizer = new AdminAuthorizer(logger)
    const intentWatcherAuthorizer: IntentWatcherAuthorizer = new IntentWatcherAuthorizer(logger, entityApiAuthorizer, specDb, providerDb);
    const intentfulContext = new IntentfulContext(logger, specDb, statusDb, graveyardDb, differ, intentWatcherDB, watchlistDb, validator, entityApiAuthorizer)
    const providerApi = new Provider_API_Impl(logger, providerDb, statusDb, s2skeyDb, watchlistDb, intentfulContext, adminAuthorizer, [adminAuthorizer, entityApiAuthorizer], validator)
    const entityApi = new Entity_API_Impl(logger, statusDb, specDb, graveyardDb, providerDb, intentWatcherDB, entityApiAuthorizer, intentWatcherAuthorizer, validator, intentfulContext)
    const sessionKeyApi = new SessionKeyAPI(logger, sessionKeyDb)
    const userAuthInfoExtractor = new CompositeUserAuthInfoExtractor([
        new AdminUserAuthInfoExtractor(logger, adminKey),
        new S2SKeyUserAuthInfoExtractor(logger, s2skeyDb),
        new SessionKeyUserAuthInfoExtractor(logger, sessionKeyApi, providerDb)
    ]);
    const enginePapieaVersion = getPapieaVersion()
    const papieaErrorFactory = PapieaErrorResponseImpl.create(logger)
    const checkVersionMiddleware = getVersionVerifier(enginePapieaVersion)
    app.use(checkVersionMiddleware)
    app.use(createAuthnRouter(logger, userAuthInfoExtractor));
    app.use(createOAuth2Router(logger, oauth2RedirectUri, providerDb, sessionKeyApi));
    app.use('/provider', createProviderAPIRouter(logger, providerApi, trace));
    app.use('/services', createEntityAPIRouter(logger, entityApi, trace));
    app.use('/api-docs', createAPIDocsRouter(logger, '/api-docs', new ApiDocsGenerator(providerDb), providerDb));
    app.use(function (err: any, req: any, res: any, next: any) {
        if (res.headersSent) {
            return next(err);
        }
        const papieaError = papieaErrorFactory(err, req);
        res.status(papieaError.status)
        res.json(papieaError.toResponse())
        logger.error(papieaError.toString(), err.stack)
    });
    return app;
}

setUpApplication().then(app => {
    app.listen(serverPort, function () {
        console.info(`Papiea app listening on port ${serverPort}!`);
    });
}).catch(console.error);
