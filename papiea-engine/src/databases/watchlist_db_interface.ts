import {Diff, Entity, Provider_Entity_Reference} from "papiea-core"

export type Watchlist = {[entity_reference: string]: {[diff_uuid: string]: Diff}}

export interface Watchlist_DB {

    add_entity(entity: Entity, diffs: Diff[]): Promise<void>

    get_watchlist(): Promise<Watchlist>

    get_entity_reference(entry: string): Provider_Entity_Reference

    remove_entity(entity_reference: Provider_Entity_Reference): Promise<void>

    add_diff(entity_reference: Provider_Entity_Reference, diff: Diff): Promise<void>

    remove_diff(entity_reference: Provider_Entity_Reference, diff: Diff): Promise<void>

    add_diffs(entity_reference: Provider_Entity_Reference, diffs: Diff[]): Promise<void>
}
