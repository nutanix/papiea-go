import {Entity_Reference, Status, Metadata} from "papiea-core"
import {IntentfulTask} from "./task_interface"
import {Handler, IntentfulListener} from "./intentful_listener_interface"
import {IntentfulTask_DB} from "../databases/intentful_task_db_interface"
import {Watchlist} from "./watchlist"
import {Status_DB} from "../databases/status_db_interface"
// @ts-ignore
import MultiMap from "mnemonist/multi-map"

var MultiMap = require('mnemonist/multi-map');
import {timeout} from "../utils/utils"

export class IntentfulListenerMongo implements IntentfulListener {
    private readonly intentfulTaskDb: IntentfulTask_DB
    private watchlist: Watchlist
    private statuses: MultiMap<string, string>
    private statusDb: Status_DB
    onTask: Handler<(task: IntentfulTask) => Promise<void>>
    onStatus: Handler<(entity: Entity_Reference, specVersion: number, status: Status) => Promise<void>>

    static async create(intentfulTaskDb: IntentfulTask_DB, statusDb: Status_DB, watchlist: Watchlist): Promise<IntentfulListener> {
        const statusMap = new MultiMap(Set)
        const statuses = await statusDb.list_status({})
        statuses.forEach(([metadata, status]) => {
            statusMap.set(metadata.uuid, JSON.stringify(status))
        })
        const listener = new IntentfulListenerMongo(intentfulTaskDb, statusDb, watchlist, statusMap)
        listener._run()
        return listener
    }

    get_watchlist_tasks(): Set<IntentfulTask> {
        return this.watchlist.reduce((acc: Set<IntentfulTask>, entityTask) => {
            entityTask.tasks.forEach(task => {
                acc.add(task)
            })
            return acc
        }, new Set<IntentfulTask>())
    }

    constructor(intentfulTaskDb: IntentfulTask_DB, statusDb: Status_DB, watchlist: Watchlist, statuses: MultiMap<string, string>) {
        this.statusDb = statusDb
        this.intentfulTaskDb = intentfulTaskDb
        this.onTask = new Handler()
        this.onStatus = new Handler()
        this.watchlist = watchlist
        this.statuses = statuses
    }

    protected async _run() {
        let currTasks: IntentfulTask[]
        let watchlistTasks: Set<IntentfulTask>
        let currStatuses: [Metadata, Status][]
        while (true) {
            currTasks = await this.intentfulTaskDb.list_tasks({ marked_for_deletion: null })
            watchlistTasks = this.get_watchlist_tasks()
            this.checkTasks(currTasks, watchlistTasks)

            currStatuses = await this.statusDb.get_statuses_by_ref(currTasks.map(task => task.entity_ref))
            this.checkStatuses(currStatuses)
            await timeout(5000)
        }
    }

    async checkTasks(currTasks: IntentfulTask[], watchlistTasks: Set<IntentfulTask>) {
        for (let task of currTasks) {
            if (!watchlistTasks.has(task)) {
                await this.onTask.call(task)
            }
        }
    }

    async checkStatuses(currStatuses: [Metadata, Status][]) {
        for (let entityStatus of currStatuses) {
            let statuses = this.statuses.get(entityStatus[0].uuid)
            if (statuses === undefined) {
                await this.onStatus.call({
                    kind: entityStatus[0].kind,
                    uuid: entityStatus[0].uuid
                } as Entity_Reference, entityStatus[0].spec_version, entityStatus[1])
            } else {
                if (!(statuses as Set<string>).has(JSON.stringify(entityStatus[1]))) {
                    await this.onStatus.call({
                        kind: entityStatus[0].kind,
                        uuid: entityStatus[0].uuid
                    } as Entity_Reference, entityStatus[0].spec_version, entityStatus[1])
                }
            }
        }
        const statusMap = new MultiMap(Set)
        currStatuses.forEach(([metadata, status]) => {
            statusMap.set(metadata.uuid, JSON.stringify(status))
        })
        this.statuses = statusMap
    }
}