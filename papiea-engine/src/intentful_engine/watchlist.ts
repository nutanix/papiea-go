import { Diff, Entity_Reference, Version, Metadata } from "papiea-core"

// I don't like the provider being necessary here too much, maybe rethink this
// TODO: this structure could be simplified because provider ref is in metadata now
export interface EntryReference {
    provider_reference: {
        provider_prefix: string,
        provider_version: Version
    },
    entity_reference: Entity_Reference
}
const stringifyEntryRef = (r: EntryReference) => [
    r.provider_reference.provider_prefix,
    r.provider_reference.provider_version,
    r.entity_reference.kind,
    r.entity_reference.uuid,
].join('/')

export function create_entry(metadata: Metadata): EntryReference {
    return {
        provider_reference: {
            provider_prefix: metadata.provider_prefix,
            provider_version: metadata.provider_version
        },
        entity_reference: {
            uuid: metadata.uuid,
            kind: metadata.kind
        }
    }
}

export type WatchlistEntry = {[entity_reference: string]: {[diff_uuid: string]: Diff}}
export type Watchlist = WatchlistEntry[]

// This Data Structure is WIP
// It should be helper for working with single entity-diff in the list
export class WatchlistMapper {
    private _entries: Watchlist

    constructor(watchlist: Watchlist) {
        this._entries = watchlist
    }
}
