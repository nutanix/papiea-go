import { Collection, Db } from "mongodb"
import { SortParams } from "../entity/entity_api_impl"
import { Logger } from "../logger_interface"
import { IntentfulTask_DB } from "./intentful_task_db_interface"
import { IntentfulTask } from "../tasks/task_interface"
import { Watchlist } from "../tasks/watchlist"

type TaskAggregationResult = TaskAggregation[]

interface TaskAggregation {
    _id: string,
    tasks: IntentfulTask[]
}

export class IntentfulTask_DB_Mongo implements IntentfulTask_DB {
    collection: Collection;
    logger: Logger;

    constructor(logger: Logger, db: Db) {
        this.collection = db.collection("task");
        this.logger = logger;
    }

    async init(): Promise<void> {
        try {
            await this.collection.createIndex(
                { "uuid": 1 },
                { unique: true },
            )
        } catch (err) {
            throw err
        }
    }

    async save_task(task: IntentfulTask): Promise<void> {
        task.created_at = new Date()
        await this.collection.insertOne(task);
    }

    async get_task(uuid: string): Promise<IntentfulTask> {
        const result: IntentfulTask | null = await this.collection.findOne({
            "uuid": uuid,
        });
        if (result === null) {
            throw new Error("key not found");
        }
        return result;
    }
    async get_watchlist(): Promise<Watchlist> {
        const result = await this.collection.aggregate([
            {
                $group: {
                    _id: "$entity_ref.uuid", tasks: { $push: "$$ROOT" }
                }
            }
        ]).toArray()
        const tasks = result as TaskAggregationResult
        return tasks.reduce((acc: Watchlist, curr) => {
            acc.push({
                entity_id: curr._id,
                tasks: curr.tasks
            })
            return acc
        }, [])
    }

    async update_task(uuid: string, delta: Partial<IntentfulTask>): Promise<void> {
        const result = await this.collection.updateOne({
            uuid
        }, {
            $set: delta
        })
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed update task");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error(`Amount of task updated must be 0 or 1, found: ${result.result.n}`);
        }
    }


    async list_tasks(fields_map: any, sortParams?: SortParams): Promise<IntentfulTask[]> {
        const filter: any = Object.assign({}, fields_map);
        if (sortParams) {
            return await this.collection.find(filter).sort(sortParams).toArray();
        } else {
            return await this.collection.find(filter).toArray();
        }
    }

    async delete_task(uuid: string): Promise<void> {
        const result = await this.collection.deleteOne({
            uuid
        })
        if (result.result.n === undefined || result.result.ok !== 1) {
            throw new Error("Failed to delete a task");
        }
        if (result.result.n !== 1 && result.result.n !== 0) {
            throw new Error(`Amount of deleted task must be 0 or 1, found: ${result.result.n}`);
        }
        return;
    }
}
