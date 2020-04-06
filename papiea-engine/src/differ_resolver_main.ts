import { WinstonLogger } from "./logger"
import { MongoConnection } from "./databases/mongo"
import { Watchlist } from "./tasks/watchlist"
import { IntentfulListenerMongo } from "./tasks/intentful_listener_mongo"
import { DifferResolver } from "./tasks/differ_resolver"

declare var process: {
    env: {
        SERVER_PORT: string,
        MONGO_DB: string,
        MONGO_URL: string,
        PAPIEA_PUBLIC_URL: string,
        DEBUG_LEVEL: string,
        PAPIEA_ADMIN_S2S_KEY: string,
        LOGGING_LEVEL: string
        PAPIEA_DEBUG: string,
        DELETED_TASK_PERSIST_SECONDS: string
    },
    title: string;
};

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017';
const mongoDb = process.env.MONGO_DB || 'papiea';
const loggingLevel = process.env.LOGGING_LEVEL || 'info';

async function setUpDiffResolver() {
    const logger = new WinstonLogger(loggingLevel);
    const mongoConnection: MongoConnection = new MongoConnection(mongoUrl, mongoDb);
    await mongoConnection.connect();

    const specDb = await mongoConnection.get_spec_db(logger);
    const statusDb = await mongoConnection.get_status_db(logger);
    const intentfulTaskDb = await mongoConnection.get_intentful_task_db(logger)

    const watchlist: Watchlist = await intentfulTaskDb.get_watchlist()
    const intentfulListener = await IntentfulListenerMongo.create(intentfulTaskDb, statusDb, watchlist)

    const diffResolver = new DifferResolver(intentfulTaskDb, specDb, statusDb, intentfulListener, watchlist)
    console.log("Running differ resolver")
    await diffResolver.run(5000)
}

setUpDiffResolver().then(()=>console.debug("Exiting differ resolver")).catch(console.error)