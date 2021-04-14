import {Backoff, Diff, DiffContent, Metadata, Provider_Entity_Reference} from "papiea-core"

export type Watchlist = Map<Provider_Entity_Reference, Diff[]>

export interface Watchlist_DB {


    get_watchlist(page_number?: number): Promise<Watchlist>

    add_entity(metadata: Metadata, diffs: Diff[]): Promise<void>

    add_diff(entity_reference: Provider_Entity_Reference, diff: Diff): Promise<void>

    add_diffs(entity_reference: Provider_Entity_Reference, diffs: Diff[]): Promise<void>

    get_entity_diffs(entity_ref: Provider_Entity_Reference): Promise<Diff[]>

    update_diff_fields(entity_reference: Provider_Entity_Reference, diff_id: string, diff_fields: DiffContent[]): Promise<void>

    update_diff_backoff(entity_reference: Provider_Entity_Reference, diff_id: string, backoff: Backoff): Promise<void>

    remove_diffs(entity_reference: Provider_Entity_Reference, diffs: Diff[]): Promise<void>

    remove_diff(entity_reference: Provider_Entity_Reference, diff: Diff): Promise<void>

    remove_entity(entity_reference: Provider_Entity_Reference): Promise<void>
}
