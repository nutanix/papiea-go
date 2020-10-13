import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { Metadata, Spec, Entity_Reference, Entity, EntitySpec, PapieaError, IntentWatcher, IntentfulStatus } from "papiea-core";
import {
    BadRequestError,
    ConflictingEntityError,
    EntityNotFoundError,
    PermissionDeniedError,
    ProcedureInvocationError,
    PapieaServerError,
    UnauthorizedError,
    ValidationError
} from "./errors/errors";

const BATCH_SIZE = 20

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

function make_request<T = any, Y = AxiosPromise<T>>(f: (url: string, data?: any, config?: AxiosRequestConfig) => Y, url: string, data?: any, config?: AxiosRequestConfig): Y {
    try {
        return f(url, data, config)
    } catch (e) {
        switch (e?.response?.data?.error.type) {
            case PapieaError.ConflictingEntity:
                throw new ConflictingEntityError(e.response.data.error.message, e)
            case PapieaError.PermissionDenied:
                throw new PermissionDeniedError(e.response.data.error.message, e)
            case PapieaError.EntityNotFound:
                throw new EntityNotFoundError(e.response.data.error.message, e)
            case PapieaError.ProcedureInvocation:
                throw new ProcedureInvocationError(e.response.data.error.message, e)
            case PapieaError.Unauthorized:
                throw new UnauthorizedError(e.response.data.error.message, e)
            case PapieaError.Validation:
                throw new ValidationError(e.response.data.error.message, e)
            case PapieaError.BadRequest:
                throw new BadRequestError(e.response.data.error.message, e)
            case PapieaError.ServerError:
                throw new PapieaServerError(e.response.data.error.message, e)
            default:
                throw new Error(e)
        }
    }
}

async function create_entity(provider: string, kind: string, version: string, request_spec: Spec, papiea_url: string, meta_extension: any, s2skey: string): Promise<EntitySpec> {
    const payload = {
        spec: request_spec,
        ...(meta_extension) && { metadata: { extension: meta_extension } }
    }
    const { data: { metadata, spec } } = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }`, payload, { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return { metadata, spec };
}

async function create_entity_with_meta(provider: string, kind: string, version: string, meta: Partial<Metadata>, request_spec: Spec, papiea_url: string, s2skey: string): Promise<EntitySpec> {
    const { data: { metadata, spec } } = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }`, {
        spec: request_spec,
        metadata: meta
    }, { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return { metadata, spec };
}

async function update_entity(provider: string, kind: string, version: string, request_spec: Spec, request_metadata: Metadata, papiea_url: string, s2skey: string): Promise<IntentWatcher | undefined> {
    const { data: { watcher } } = await make_request(axios.put, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/${ request_metadata.uuid }`, {
        spec: request_spec,
        metadata: {
            spec_version: request_metadata.spec_version
        }
    }, { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return watcher
}

async function get_entity(provider: string, kind: string, version: string, entity_reference: Entity_Reference, papiea_url: string, s2skey: string): Promise<Entity> {
    const { data: { metadata, spec, status } } = await make_request(axios.get, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/${ entity_reference.uuid }`,
        { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return { metadata, spec, status }
}

async function delete_entity(provider: string, kind: string, version: string, entity_reference: Entity_Reference, papiea_url: string, s2skey: string): Promise<void> {
    await make_request(axios.delete, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/${ entity_reference.uuid }`, { headers: { "Authorization": `Bearer ${ s2skey }` } });
}

async function invoke_entity_procedure(provider: string, kind: string, version: string, procedure_name: string, input: any, entity_reference: Entity_Reference, papiea_url: string, s2skey: string): Promise<any> {
    const res = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/${ entity_reference.uuid }/procedure/${ procedure_name }`, { input }, { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return res.data;
}

async function invoke_kind_procedure(provider: string, kind: string, version: string, procedure_name: string, input: any, papiea_url: string, s2skey: string): Promise<any> {
    const res = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/procedure/${ procedure_name }`, { input }, { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return res.data;
}

export async function invoke_provider_procedure(provider: string, version: string, procedure_name: string, input: any, papiea_url: string, s2skey: string): Promise<any> {
    const res = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/procedure/${ procedure_name }`, { input }, { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return res.data;
}

export interface FilterResults {
    entity_count: number
    results: Entity[]
}

export async function filter_entity_iter(provider: string, kind: string, version: string, filter: any, papiea_url: string, s2skey: string): Promise<(batch_size?: number, offset?: number) => AsyncGenerator<any, undefined, any>> {
    const iter_func = await make_request(iter_filter, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/filter`, filter, { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return iter_func
}

export async function filter_entity(provider: string, kind: string, version: string, filter: any, papiea_url: string, s2skey: string): Promise<FilterResults> {
    const res = await make_request(axios.post, `${ papiea_url }/services/${ provider }/${ version }/${ kind }/filter`, filter, { headers: { "Authorization": `Bearer ${ s2skey }` } });
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

async function get_intent_watcher(papiea_url: string, id: string, s2skey: string): Promise<IntentWatcher> {
    const res = await make_request(axios.get, `${ papiea_url }/services/intent_watcher/${ id }`,
        { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return res.data
}

// filter_intent_watcher({'status':'Pending'})
async function filter_intent_watcher(papiea_url: string, filter: any, s2skey: string): Promise<FilterResults> {
    const res = await make_request(axios.post, `${ papiea_url }/services/intent_watcher/filter`, filter, { headers: { "Authorization": `Bearer ${ s2skey }` } });
    return res.data
}

async function wait_for_watcher_status(papiea_url: string, s2skey: string, watcher_ref: IntentWatcher, watcher_status: IntentfulStatus, timeout_secs: number, delay_millis: number): Promise<boolean> {
    const start_time: number = new Date().getTime()
    while (true) {
        const watcher = await get_intent_watcher(papiea_url, watcher_ref.uuid, s2skey)
        if (watcher.status == watcher_status) {
            return true;
        }
        const end_time: number = new Date().getTime()
        const time_elapsed = (end_time - start_time)/1000
        if (time_elapsed > timeout_secs) {
            throw new Error("Timeout waiting for intent watcher status")
        }
        await delay(delay_millis)
    }
}

export interface ProviderClient {
    get_kind(kind: string): EntityCRUD

    invoke_procedure(procedure_name: string, input: any): Promise<any>
}

export function provider_client(papiea_url: string, provider: string, version: string, s2skey?: string, meta_extension?: (s2skey: string) => any): ProviderClient {
    const the_s2skey = s2skey ?? 'anonymous'
    return <ProviderClient>{
        get_kind: (kind: string) => kind_client(papiea_url, provider, kind, version, the_s2skey, meta_extension),
        invoke_procedure: (proc_name: string, input: any) => invoke_provider_procedure(provider, version, proc_name, input, papiea_url, the_s2skey)
    }
}

// map based crud
export interface EntityCRUD {
    get(entity_reference: Entity_Reference): Promise<Entity>

    create(spec: Spec): Promise<EntitySpec>

    create_with_meta(metadata: Partial<Metadata>, spec: Spec): Promise<EntitySpec>

    update(metadata: Metadata, spec: Spec): Promise<IntentWatcher | undefined>

    delete(entity_reference: Entity_Reference): Promise<void>

    filter(filter: any): Promise<FilterResults>

    filter_iter(filter: any): Promise<(batch_size?: number, offset?: number) => AsyncGenerator<any, undefined, any>>

    list_iter(): Promise<(batch_size?: number, offset?: number) => AsyncGenerator<any, undefined, any>>

    invoke_procedure(procedure_name: string, entity_reference: Entity_Reference, input: any): Promise<any>

    invoke_kind_procedure(procedure_name: string, input: any): Promise<any>
}

export function kind_client(papiea_url: string, provider: string, kind: string, version: string, s2skey?: string, meta_extension?: (s2skey: string) => any): EntityCRUD {
    const the_s2skey = s2skey ?? 'anonymous'
    const crudder: EntityCRUD = {
        get: (entity_reference: Entity_Reference) => get_entity(provider, kind, version, entity_reference, papiea_url, the_s2skey),
        create: (spec: Spec) => create_entity(provider, kind, version, spec, papiea_url, meta_extension ? meta_extension(the_s2skey) : undefined, the_s2skey),
        create_with_meta: (meta: Partial<Metadata>, spec: Spec) => create_entity_with_meta(provider, kind, version, meta, spec, papiea_url, the_s2skey),
        update: (metadata: Metadata, spec: Spec) => update_entity(provider, kind, version, spec, metadata, papiea_url, the_s2skey),
        delete: (entity_reference: Entity_Reference) => delete_entity(provider, kind, version, entity_reference, papiea_url, the_s2skey),
        filter: (filter: any) => filter_entity(provider, kind, version, filter, papiea_url, the_s2skey),
        filter_iter: (filter: any) => filter_entity_iter(provider, kind, version, filter, papiea_url, the_s2skey),
        list_iter: () => filter_entity_iter(provider, kind, version, {}, papiea_url, the_s2skey),
        invoke_procedure: (proc_name: string, entity_reference: Entity_Reference, input: any) => invoke_entity_procedure(provider, kind, version, proc_name, input, entity_reference, papiea_url, the_s2skey),
        invoke_kind_procedure: (proc_name: string, input: any) => invoke_kind_procedure(provider, kind, version, proc_name, input, papiea_url, the_s2skey)
    }
    return crudder
}

export interface IntentWatcherClient {
    get(id: string): Promise<IntentWatcher>

    list_iter(): Promise<FilterResults>

    filter_iter(filter: any): Promise<FilterResults>

    wait_for_status_change(watcher_ref: any, watcher_status: IntentfulStatus, timeout_secs?: number, delay_millis?: number): Promise<boolean>
}

export function intent_watcher_client(papiea_url: string, s2skey?: string): IntentWatcherClient {
    const the_s2skey = s2skey ?? 'anonymous'
    const intent_watcher: IntentWatcherClient = {
        get: (id: string) => get_intent_watcher(papiea_url, id, the_s2skey),
        list_iter: () => filter_intent_watcher(papiea_url, "", the_s2skey),
        filter_iter: (filter: any) => filter_intent_watcher(papiea_url, filter, the_s2skey),
        wait_for_status_change: (watcher_ref: any, watcher_status: IntentfulStatus, timeout_secs: number = 50, delay_millis: number = 500) => wait_for_watcher_status(papiea_url, the_s2skey, watcher_ref, watcher_status, timeout_secs, delay_millis)
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

    create_with_meta(meta: Metadata, spec: Spec): Promise<ImmutableEntityObject>

    filter(filter: any): Promise<ImmutableEntityObject[]>

    get(entity_reference: Entity_Reference): Promise<ImmutableEntityObject>
}

export function objectify(c: EntityCRUD): ImmutableEntityObjectBuilder {
    return {
        create: async (spec: Spec) => new ImmutableEntityObject(await c.create(spec), c).refresh(),
        create_with_meta: async (meta: Partial<Metadata>, spec: Spec) => new ImmutableEntityObject(await c.create_with_meta(meta, spec), c).refresh(),
        filter: async (filter: any) => (await c.filter(filter)).results.map(e => new ImmutableEntityObject(e, c)),
        get: async (entity_reference: Entity_Reference) => new ImmutableEntityObject(await c.get(entity_reference), c)
    }
}
