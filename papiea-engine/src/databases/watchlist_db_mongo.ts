import { Collection, Db } from "mongodb";
import { Logger } from "papiea-backend-utils";
import { Watchlist_DB } from "./watchlist_db_interface";
import { SerializedWatchlist, Watchlist } from "../intentful_engine/watchlist";
import { PapieaException } from "../errors/papiea_exception";
import { PapieaEngineTags } from "papiea-core"

type WatchlistResult = {
    id: number
    watchlist: SerializedWatchlist
}

export class Watchlist_Db_Mongo implements Watchlist_DB {
    collection: Collection;
    logger: Logger

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("watchlist");
        this.logger = logger;
    }

    async init(): Promise<void> {
        await this.collection.createIndex(
            { "id": 1 },
            { name: "watchlist_id", unique: true }
        );
    }

    async update_watchlist(watchlist: Watchlist): Promise<void> {
        this.logger.debug(`BEGIN ${this.update_watchlist.name} in watchlist database`, { tags: [PapieaEngineTags.Database] })
        const result = await this.collection.updateOne({
            "id": 1,
        }, {
            $set: {
                watchlist: watchlist.serialize()
            }
        }, {
            upsert: true
        });
        if (result.result.n !== 1) {
            throw new PapieaException(`MongoDBError: Amount of updated entries doesn't equal to 1: ${result.result.n}`)
        }
        this.logger.debug(`END ${this.update_watchlist.name} in watchlist database`, { tags: [PapieaEngineTags.Database] })
    }

    async get_watchlist(): Promise<Watchlist> {
        this.logger.debug(`BEGIN ${this.get_watchlist.name} in watchlist database`, { tags: [PapieaEngineTags.Database] })
        const result: WatchlistResult | null = await this.collection.findOne({
            "id": 1,
        });
        if (result === null) {
            const watchlist = new Watchlist()
            await this.update_watchlist(watchlist)
            this.logger.debug(`END ${this.get_watchlist.name} in watchlist database`, { tags: [PapieaEngineTags.Database] })
            return watchlist
        }
        this.logger.debug(`END ${this.get_watchlist.name} in watchlist database`, { tags: [PapieaEngineTags.Database] })
        return new Watchlist(result.watchlist)
    }
}
