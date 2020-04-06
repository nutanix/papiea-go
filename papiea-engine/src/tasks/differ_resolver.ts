// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import {Entity_Reference, Status, IntentfulStatus} from "papiea-core";
import {IntentfulTask} from "./task_interface"
import {timeout} from "../utils/utils"
import {IntentfulTask_DB_Mongo} from "../databases/intentful_task_db_mongo"
import {Spec_DB} from "../databases/spec_db_interface"
import {Status_DB} from "../databases/status_db_interface"
import {Watchlist, EntityTasks} from "./watchlist"
import {Handler, IntentfulListener} from "./intentful_listener_interface"
import {SFSCompiler} from "../intentful_core/sfs_compiler"
import axios from "axios"

// This should be run in a different process
export class DifferResolver {
    protected readonly intentfulTaskDb: IntentfulTask_DB_Mongo
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB

    protected watchlist: Watchlist
    private intentfulListener: IntentfulListener

    constructor(taskDb: IntentfulTask_DB_Mongo, specDb: Spec_DB, statusDb: Status_DB, intentfulListener: IntentfulListener, watchlist: Watchlist) {
        this.intentfulTaskDb = taskDb
        this.specDb = specDb
        this.statusDb = statusDb
        this.watchlist = watchlist
        this.intentfulListener = intentfulListener
        this.onTask = this.onTask.bind(this)
        this.onStatus = this.onStatus.bind(this)
        this.intentfulListener.onTask = new Handler(this.onTask)
        this.intentfulListener.onStatus = new Handler(this.onStatus)
    }

    public async run(delay: number, taskExpirySeconds: number = 120) {
        try {
            await this._run(delay, taskExpirySeconds)
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    private async _run(delay: number, taskExpirySeconds: number) {
        while (true) {
            await timeout(delay)
            await this.checkActiveTasksHealth()
            await this.retryTasks()
            await this.clearFinishedTasks(taskExpirySeconds)
        }
    }

    public async activateTask(): Promise<void> {
        // TODO: maybe introduce watchlist as a DAO
        for (let entityTask of this.watchlist) {
            let activeTasks = entityTask.tasks.filter(task => task.status === IntentfulStatus.Active || task.status === IntentfulStatus.Failed)
            let pendingTasks = entityTask.tasks.filter(task => task.status === IntentfulStatus.Pending)
            if (activeTasks.length === 0 && pendingTasks.length > 0) {
                let activeTask = pendingTasks[0]
                activeTask.status = IntentfulStatus.Active
                const [metadata, entitySpec] = await this.specDb.get_spec(activeTask.entity_ref)
                const [_, entityStatus] = await this.statusDb.get_status(activeTask.entity_ref)
                await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
                for (let diff of activeTask.diffs) {
                    await axios.post(diff.intentful_signature.procedure_callback, {
                        metadata: metadata,
                        spec: entitySpec,
                        status: entityStatus,
                        input: diff.diff_fields
                    })
                    // This should be a concrete address of a handling process
                    diff.handler_url = `${diff.intentful_signature.base_callback}/healthcheck`
                }
                await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
            }
        }
    }

    private async retryTasks(): Promise<void> {
        for (let entityTask of this.watchlist) {
            let failedTasks = entityTask.tasks.filter(task => task.status === IntentfulStatus.Failed)
            if (failedTasks.length !== 0) {
                if (failedTasks.length > 2) {
                    // TODO: should be a custom error
                    throw new Error("There cannot be more than one failed task on an entity")
                }
                const failedTask = failedTasks[0]
                failedTask.status = IntentfulStatus.Active
                const [metadata, entitySpec] = await this.specDb.get_spec(failedTask.entity_ref)
                const [_, entityStatus] = await this.statusDb.get_status(failedTask.entity_ref)
                await this.intentfulTaskDb.update_task(failedTask.uuid, failedTask)
                for (let diff of failedTask.diffs) {
                    await axios.post(diff.intentful_signature.procedure_callback, {
                        metadata: metadata,
                        spec: entitySpec,
                        status: entityStatus,
                        input: diff.diff_fields
                    })
                }
            }
        }
    }

    public async clearFinishedTasks(taskExpirySeconds: number): Promise<void> {
        // Remove all watches on entities which have no more diffs to look
        this.watchlist = this.watchlist.filter((entity_task: EntityTasks) => entity_task.tasks.length > 0)

        const tasks = this.watchlist.reduce((acc: IntentfulTask[], entityTask) => {
            entityTask.tasks.forEach(task => {
                acc.push(task)
            })
            return acc
        }, [])
        for (let task of tasks) {
            if (task.status !== IntentfulStatus.Active && task.status !== IntentfulStatus.Pending && task.status !== IntentfulStatus.Failed) {
                if (task.last_status_changed && (new Date().getTime() - task.last_status_changed.getTime()) / 1000 > taskExpirySeconds) {
                    await this.removeTask(task)
                }
            }
        }
    }

    private async removeTask(task: IntentfulTask): Promise<void> {
        for (let i in this.watchlist) {
            for (let j in this.watchlist[i].tasks) {
                if (this.watchlist[i].tasks[j] === task) {
                    await this.intentfulTaskDb.delete_task(this.watchlist[i].tasks[j].uuid)
                    this.watchlist[i].tasks.splice(Number(j), 1)
                }
            }
        }
    }

    public async onTask(task: IntentfulTask) {
        if (this.watchlist.find((item: EntityTasks) => item.entity_id == task.entity_ref.uuid) == undefined) {
            this.watchlist.push({
                entity_id: task.entity_ref.uuid,
                tasks: [task]
            })
        }
    }

    protected async onStatus(entity: Entity_Reference, specVersion: number, status: Status) {
        await this.activateTask()
        const [metadata, spec] = await this.specDb.get_spec(entity)
        const tasks = this.watchlist.filter(entityTasks => entityTasks.entity_id === entity.uuid)
        if (tasks.length !== 0) {
            const activeTasks = tasks[0].tasks.filter(task => task.status === IntentfulStatus.Active)
            console.log("Active Tasks: ", activeTasks)
            if (activeTasks.length === 0) {
                return
            } else if (activeTasks.length > 1) {
                // TODO: This should be configurable via strategy
                throw new Error(`There cannot be more than one task running for entity with uuid: ${entity.uuid}`)
            }
            const activeTask = activeTasks[0]
            const diffs = activeTask.diffs.filter(diff => {
                const compiledSignature = SFSCompiler.compile_sfs(diff.intentful_signature.signature)
                return SFSCompiler.run_sfs(compiledSignature, spec, status) !== null
            })
            if (metadata.spec_version > activeTask.spec_version + 1) {
                if (diffs.length === 0) {
                    activeTask.status = IntentfulStatus.Outdated
                } else if (diffs.length === activeTask.diffs.length) {
                    activeTask.status = IntentfulStatus.Failed
                } else {
                    activeTask.status = IntentfulStatus.Completed_Partially
                }
                await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
            } else {
                if (diffs.length === 0) {
                    activeTask.status = IntentfulStatus.Completed_Successfully
                    await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
                }
            }
        }
    }

    private async checkActiveTasksHealth() {
        for (let entityTask of this.watchlist) {
            let activeTasks = entityTask.tasks.filter(task => task.status === IntentfulStatus.Active)
            if (activeTasks.length === 1) {
                let activeTask = activeTasks[0]
                try {
                    for (let diff of activeTask.diffs) {
                        const compiledSignature = SFSCompiler.compile_sfs(diff.intentful_signature.signature)
                        const [, spec] = await this.specDb.get_spec(activeTask.entity_ref)
                        const [, status] = await this.statusDb.get_status(activeTask.entity_ref)
                        if (SFSCompiler.run_sfs(compiledSignature, spec, status) !== null) {
                            await axios.get(`${diff.intentful_signature.base_callback}/healthcheck`)
                        }
                    }
                } catch (e) {
                    activeTask.status = IntentfulStatus.Failed
                    await this.intentfulTaskDb.update_task(activeTask.uuid, activeTask)
                }
            }
        }
    }
}