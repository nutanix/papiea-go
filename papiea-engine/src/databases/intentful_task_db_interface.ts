import { SortParams } from "../entity/entity_api_impl"
import { IntentfulTask } from "../tasks/task_interface"
import { Watchlist } from "../tasks/watchlist"

export interface IntentfulTask_DB {

    save_task(task: IntentfulTask): Promise<void>

    list_tasks(fields_map: any, sortParams?: SortParams): Promise<IntentfulTask[]>

    get_task(uuid: string): Promise<IntentfulTask>

    update_task(uuid: string, delta: Partial<IntentfulTask>): Promise<void>

    get_watchlist(): Promise<Watchlist>

    delete_task(uuid: string): Promise<void>
}