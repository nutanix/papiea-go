import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import {
    Metadata,
    Spec,
    Entity_Reference,
    Entity,
    EntityCreateOrUpdateResult,
    PapieaError,
    IntentWatcher,
    IntentfulStatus,
    Status
} from "papiea-core"
import {Tracer} from "opentracing"
import {getTracer, spanOperation} from "papiea-backend-utils"
import https = require('https')

let tracerOpen = false
let clientTracer: Tracer | null = null

class ClientTracer {

    protected constructor() {
    }

    static getTracer(): Tracer {
        if (!clientTracer) {
            const tracer = getTracer("papiea-client")
            clientTracer = tracer
            tracerOpen = true
            return tracer
        } else {
            return clientTracer
        }
    }

    static close(): void {
        if (!clientTracer) {
            console.error("Unable to close tracer. Tracer uninitialized")
        }
        try {
            if (tracerOpen) {
                (clientTracer as any).close()
                tracerOpen = false
            }
        } catch (e) {
            console.error(`Unable to close tracer. ${e}`)
        }
    }
}

type EntitySpec = Pick<Entity, Metadata | Spec>

const BATCH_SIZE = 20

const packageJSON = require('../package.json');
const PAPIEA_VERSION: string = packageJSON.version.split('+')[0];

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

function getHeaders(s2skey: string): any {
    return { "Authorization": `Bearer ${ s2skey }`, "Papiea-Version": `${ PAPIEA_VERSION }` }
}

function make_request<T = any, Y = AxiosPromise<T>>(f: (url: string, data?: any, config?: AxiosRequestConfig) => Y, url: string, data?: any, config?: AxiosRequestConfig): Y {
    return f(url, data, config)
}

async function create_entity(provider: string, kind: string, version: string, payload: any, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<EntityCreateOrUpdateResult> {
    const headers = getHeaders(s2skey)
    const span = spanOperation("create_entity_client", {headers, tracer})
    const { data: { metadata, spec, intent_watcher, status } } = await make_request<EntityCreateOrUpdateResult>(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }`, payload, {httpsAgent, headers});
    span.finish()
    return { metadata, spec, intent_watcher, status };
}

async function update_entity(provider: string, kind: string, version: string, request_spec: Spec, request_metadata: Metadata, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<EntityCreateOrUpdateResult> {
    const headers = getHeaders(s2skey)
    const span = spanOperation("update_entity_client", {headers, tracer}, {entity_uuid: request_metadata.uuid})
    const { data: { metadata, spec, intent_watcher, status } } = await make_request(axios.put, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/${ request_metadata.uuid }`, {
        spec: request_spec,
        metadata: request_metadata
    }, {httpsAgent, headers});
    span.finish()
    return { metadata, spec, intent_watcher, status }
}

async function get_entity(provider: string, kind: string, version: string, entity_reference: Entity_Reference, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<Entity> {
    const headers = getHeaders(s2skey)
    const span = spanOperation("get_entity_client", {headers, tracer}, {entity_uuid: entity_reference.uuid})
    const { data: { metadata, spec, status } } = await make_request(axios.get, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/${ entity_reference.uuid }`,
        {httpsAgent, headers});
    span.finish()
    return { metadata, spec, status }
}

async function delete_entity(provider: string, kind: string, version: string, entity_reference: Entity_Reference, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<void> {
    const headers = getHeaders(s2skey)
    const span = spanOperation("delete_entity_client", {headers, tracer}, {entity_uuid: entity_reference.uuid})
    await make_request(axios.delete, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/${ entity_reference.uuid }`, {httpsAgent, headers});
    span.finish()
}

async function invoke_entity_procedure(provider: string, kind: string, version: string, procedure_name: string, input: any, entity_reference: Entity_Reference, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<any> {
    const headers = getHeaders(s2skey)
    const span = spanOperation(`${procedure_name}_entity_procedure_client`, {headers, tracer}, {entity_uuid: entity_reference.uuid})
    const res = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/${ entity_reference.uuid }/procedure/${ procedure_name }`, input, {httpsAgent, headers});
    span.finish()
    return res.data;
}

async function invoke_kind_procedure(provider: string, kind: string, version: string, procedure_name: string, input: any, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<any> {
    const headers = getHeaders(s2skey)
    const span = spanOperation(`${procedure_name}_kind_procedure_client`, {headers, tracer})
    const res = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/procedure/${ procedure_name }`, input, {httpsAgent, headers});
    span.finish()
    return res.data;
}

export async function invoke_provider_procedure(provider: string, version: string, procedure_name: string, input: any, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<any> {
    const headers = getHeaders(s2skey)
    const span = spanOperation(`${procedure_name}_provider_procedure_client`, {headers, tracer})
    const res = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/procedure/${ procedure_name }`, input, {httpsAgent, headers});
    span.finish()
    return res.data;
}

export interface FilterResults {
    entity_count: number
    results: Entity[]
}

export async function filter_entity_iter(provider: string, kind: string, version: string, filter: any, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<(batch_size?: number, offset?: number) => AsyncGenerator<any, undefined, any>> {
    const iter_func = await make_request(iter_filter, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/filter`, filter, { httpsAgent, headers: { "Authorization": `Bearer ${ s2skey }`, "Papiea-Version": `${ PAPIEA_VERSION }` } });
    return iter_func
}

export async function filter_entity(provider: string, kind: string, version: string, filter: any, query: string, papiea_url: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<FilterResults> {
    const headers = getHeaders(s2skey)
    const span = spanOperation("filter_entity_client", {headers, tracer})
    const query_val: string = (query === '' ? query : '?' + query);
    const res = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/filter${ query_val }`, filter, {httpsAgent, headers});
    span.finish()
    return res.data
}

export async function iter_filter(url: string, data: any, config?: AxiosRequestConfig) {
    return (async function* iter(batch_size?: number, offset?: number): AsyncGenerator<any, undefined, any> {
        if (!batch_size) {
            batch_size = BATCH_SIZE
        }
        let res = await axios.post<FilterResults>(`${url}?limit=${batch_size}&offset=${offset ?? ''}`, data, config)
        if (res.data.results.length === 0) {
            return
        } else {
            yield* res.data.results
            yield* iter(batch_size, (offset ?? 0) + batch_size)
            return
        }
    })
}

async function get_intent_watcher(papiea_url: string, id: string, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<IntentWatcher> {
    const headers = getHeaders(s2skey)
    const span = spanOperation(`get_intent_watcher_client`, {headers, tracer})
    const res = await make_request(axios.get, `${ papiea_url }/services/intent_watcher/${ id }`,
        {httpsAgent, headers});
    span.finish()
    return res.data
}

async function filter_intent_watcher(papiea_url: string, filter: any, s2skey: string, tracer: Tracer, httpsAgent: https.Agent): Promise<FilterResults> {
    const headers = getHeaders(s2skey)
    const span = spanOperation(`filter_intent_watcher_client`, {headers, tracer})
    const res = await make_request(axios.post, `${ papiea_url }/services/intent_watcher/filter`, filter, {httpsAgent, headers});
    span.finish()
    return res.data
}

async function wait_for_watcher_status(papiea_url: string, s2skey: string, watcher_ref: IntentWatcher, watcher_status: IntentfulStatus, timeout_secs: number, delay_millis: number, tracer: Tracer, httpsAgent: https.Agent): Promise<boolean> {
    const start_time: number = new Date().getTime()
    while (true) {
        const watcher = await get_intent_watcher(papiea_url, watcher_ref.uuid, s2skey, tracer, httpsAgent)
        if (watcher.status == watcher_status) {
            return true;
        }
        const end_time: number = new Date().getTime()
        const time_elapsed = (end_time - start_time)/1000
        if (time_elapsed > timeout_secs) {
            throw new Error(`Timeout waiting for intent watcher status change with uuid: ${watcher.uuid} and entity uuid: ${watcher.entity_ref.uuid} for kind: ${watcher.entity_ref.kind} in provider with prefix: ${watcher.entity_ref.provider_prefix} and version: ${watcher.entity_ref.provider_version}`)
        }
        await delay(delay_millis)
    }
}

export interface ProviderClient {
    get_kind(kind: string): EntityCRUD

    invoke_procedure(procedure_name: string, input: any): Promise<any>

    close(): void
}

export function provider_client(papiea_url: string, provider: string, version: string, s2skey?: string, httpsAgent?: https.Agent, tracer?: Tracer): ProviderClient {
    const client_tracer = tracer ?? ClientTracer.getTracer()
    const close_func = tracer ? (tracer as any).close() : ClientTracer.close
    const the_s2skey = s2skey ?? 'anonymous'
    const client_httpsAgent = httpsAgent ?? new https.Agent()
    return {
        get_kind: (kind: string) => kind_client(papiea_url, provider, kind, version, the_s2skey, client_httpsAgent),
        invoke_procedure: (proc_name: string, input: any) => invoke_provider_procedure(provider, version, proc_name, input, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        close: () => close_func()
    }
}

// map based crud
export interface EntityCRUD {
    get(entity_reference: Entity_Reference): Promise<Entity>

    create(spec: Spec): Promise<EntityCreateOrUpdateResult>

    update(metadata: Metadata, spec: Spec): Promise<EntityCreateOrUpdateResult>

    delete(entity_reference: Entity_Reference): Promise<void>

    filter(filter: any, query?: string): Promise<FilterResults>

    filter_iter(filter: any): Promise<(batch_size?: number, offset?: number) => AsyncGenerator<any, undefined, any>>

    list_iter(): Promise<(batch_size?: number, offset?: number) => AsyncGenerator<any, undefined, any>>

    invoke_procedure(procedure_name: string, entity_reference: Entity_Reference, input: any): Promise<any>

    invoke_kind_procedure(procedure_name: string, input: any): Promise<any>

    close(): void
}

export function kind_client(papiea_url: string, provider: string, kind: string, version: string, s2skey?: string, httpsAgent?: https.Agent, tracer?: Tracer): EntityCRUD {
    const client_tracer = tracer ?? ClientTracer.getTracer()
    const close_func = tracer ? (tracer as any).close() : ClientTracer.close
    const the_s2skey = s2skey ?? 'anonymous'
    const client_httpsAgent = httpsAgent ?? new https.Agent()
    const crudder: EntityCRUD = {
        get: (entity_reference: Entity_Reference) => get_entity(provider, kind, version, entity_reference, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        create: (payload: any) => create_entity(provider, kind, version, payload, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        update: (metadata: Metadata, spec: Spec) => update_entity(provider, kind, version, spec, metadata, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        delete: (entity_reference: Entity_Reference) => delete_entity(provider, kind, version, entity_reference, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        filter: (filter: any, query: string = '') => filter_entity(provider, kind, version, filter, query, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        filter_iter: (filter: any) => filter_entity_iter(provider, kind, version, filter, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        list_iter: () => filter_entity_iter(provider, kind, version, {}, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        invoke_procedure: (proc_name: string, entity_reference: Entity_Reference, input: any) => invoke_entity_procedure(provider, kind, version, proc_name, input, entity_reference, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        invoke_kind_procedure: (proc_name: string, input: any) => invoke_kind_procedure(provider, kind, version, proc_name, input, papiea_url, the_s2skey, client_tracer, client_httpsAgent),
        close: () => close_func()
    }
    return crudder
}

export interface IntentWatcherClient {
    get(id: string): Promise<IntentWatcher>

    list_iter(): Promise<FilterResults>

    filter_iter(filter: any): Promise<FilterResults>

    wait_for_status_change(watcher_ref: any, watcher_status: IntentfulStatus, timeout_secs?: number, delay_millis?: number): Promise<boolean>

    close(): void
}

export function intent_watcher_client(papiea_url: string, s2skey?: string, httpsAgent?: https.Agent, tracer?: Tracer): IntentWatcherClient {
    const client_tracer = tracer ?? ClientTracer.getTracer()
    const close_func = tracer ? (tracer as any).close() : ClientTracer.close
    const the_s2skey = s2skey ?? 'anonymous'
    const client_httpsAgent = httpsAgent ?? new https.Agent()
    const intent_watcher: IntentWatcherClient = {
        get: (id: string) => get_intent_watcher(papiea_url, id, the_s2skey, client_tracer, client_httpsAgent),
        list_iter: () => filter_intent_watcher(papiea_url, "", the_s2skey, client_tracer, client_httpsAgent),
        filter_iter: (filter: any) => filter_intent_watcher(papiea_url, filter, the_s2skey, client_tracer, client_httpsAgent),
        wait_for_status_change: (watcher_ref: any, watcher_status: IntentfulStatus, timeout_secs: number = 50, delay_millis: number = 500) => wait_for_watcher_status(papiea_url, the_s2skey, watcher_ref, watcher_status, timeout_secs, delay_millis, client_tracer, client_httpsAgent),
        close: () => close_func()
    }
    return intent_watcher
}

// class based crud
interface EntityObjectCRUD {
    update(spec: Spec): Promise<EntityObjectCRUD>

    delete(): Promise<void>

    invoke(procedure_name: string, input: any): Promise<any>
}

export class ImmutableEntityObject implements EntityObjectCRUD {
    readonly entity: Entity | EntitySpec
    readonly crud: EntityCRUD

    constructor(e: Entity | EntitySpec, c: EntityCRUD) {
        this.entity = e
        this.crud = c
    }

    async refresh(): Promise<ImmutableEntityObject> {
        return new ImmutableEntityObject(await this.crud.get(this.entity.metadata), this.crud)
    }

    async update(spec: any): Promise<ImmutableEntityObject> {
        const _ = await this.crud.update(this.entity.metadata, spec);
        return await this.refresh();
    }

    delete(): Promise<void> {
        return this.crud.delete(this.entity.metadata)
    }

    invoke(procedure_name: string, input: any): Promise<any> {
        return this.crud.invoke_procedure(procedure_name, this.entity.metadata, input)
    }
}

interface ImmutableEntityObjectBuilder {
    create(spec: Spec): Promise<ImmutableEntityObject>

    filter(filter: any): Promise<ImmutableEntityObject[]>

    get(entity_reference: Entity_Reference): Promise<ImmutableEntityObject>
}

export function objectify(c: EntityCRUD): ImmutableEntityObjectBuilder {
    return {
        create: async (payload: any) => new ImmutableEntityObject(await c.create(payload), c).refresh(),
        filter: async (filter: any) => (await c.filter(filter)).results.map(e => new ImmutableEntityObject(e, c)),
        get: async (entity_reference: Entity_Reference) => new ImmutableEntityObject(await c.get(entity_reference), c)
    }
}
