import { Status, Spec, Entity, PapieaEngineTags } from "papiea-core"
import { Handler, IntentfulListener } from "./intentful_listener_interface"
import { Watchlist } from "./watchlist"
import { Status_DB } from "../databases/status_db_interface"
import { timeout } from "../utils/utils"
import { Spec_DB } from "../databases/spec_db_interface";
import deepEqual = require("deep-equal");
import { Logger } from "papiea-backend-utils"

export class IntentfulListenerMongo implements IntentfulListener {
    onChange: Handler<(entity: Entity) => Promise<void>>;
    private watchlist: Watchlist
    private entities: Map<string, [Spec, Status]>
    private statuses: Map<string, Status>
    private specs: Map<string, Spec>
    private specDb: Spec_DB
    private statusDb: Status_DB
    private logger: Logger

    private async check_watchlist_changes(): Promise<void> {
        this.logger.debug(`BEGIN ${this.check_watchlist_changes.name} in intentful listener`, { tags: [PapieaEngineTags.IntentfulEngine] })
        const entries = this.watchlist.entries()
        const uuids = Object.values(entries).map(ent => ent[0].entity_reference.uuid)
        const metadata_specs = await this.specDb.list_specs_in(uuids)
        const metadata_statuses = await this.statusDb.list_status_in(uuids)
        for (let i in metadata_specs) {
            // These are guaranteed to be in order because they are sorted by uuids
            const [metadata, spec] = metadata_specs[i]
            const [, status] = metadata_statuses[i]
            const entry = this.entities.get(metadata.uuid)
            if (!entry) {
                this.entities.set(metadata.uuid, [spec, status])
                continue
            }
            if (!deepEqual(spec, entry[0]) || !deepEqual(status, entry[1])) {
                this.entities.set(metadata.uuid, [spec, status])
                await this.onChange.call({ metadata, spec, status })
            }
        }
        this.logger.debug(`END ${this.check_watchlist_changes.name} in intentful listener`, { tags: [PapieaEngineTags.IntentfulEngine] })
    }

    constructor(logger: Logger, statusDb: Status_DB, specDb: Spec_DB, watchlist: Watchlist) {
        this.statusDb = statusDb
        this.specDb = specDb
        this.onChange = new Handler()
        this.watchlist = watchlist
        this.entities = new Map<string, [Spec, Status]>()
        this.statuses = new Map<string, Status>()
        this.specs = new Map<string, Spec>()
        this.logger = logger
    }

    public async run(delay: number) {
        try {
            await this._run(delay)
        } catch (e) {
            this.logger.error(`Run method for intentful listener mongo simple failed: ${e}`)
            throw e
        }
    }

    protected async _run(delay: number) {
        while (true) {
            this.logger.debug(`BEGIN ${this._run.name} in intentful listener`, { tags: [PapieaEngineTags.IntentfulEngine] })
            await timeout(delay)
            await this.check_watchlist_changes()
            this.logger.debug(`END ${this._run.name} in intentful listener`, { tags: [PapieaEngineTags.IntentfulEngine] })
        }
    }
}
