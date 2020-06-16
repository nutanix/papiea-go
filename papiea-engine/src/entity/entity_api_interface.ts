import { UserAuthInfo } from "../auth/authn"
import { Version, Spec, Metadata, uuid4, Status, Entity_Reference, Action } from "papiea-core"
import { SortParams } from "./entity_api_impl"
import { IntentfulTask } from "../tasks/task_interface"

export interface EntityAPI {
    save_entity(
        user: UserAuthInfo,
        prefix: string,
        kind_name: string,
        version: Version,
        spec_description: Spec,
        request_metadata: Metadata,
    ): Promise<[Metadata, Spec]>

    get_entity_spec(
        user: UserAuthInfo, kind_name: string, entity_uuid: uuid4,
    ): Promise<[Metadata, Spec]>

    get_intentful_task(user: UserAuthInfo, id: string): Promise<Partial<IntentfulTask>>

    get_entity_status(
        user: UserAuthInfo, kind_name: string, entity_uuid: uuid4,
    ): Promise<[Metadata, Status]>

    filter_intentful_task(
        user: UserAuthInfo, fields: any, sortParams?: SortParams,
    ): Promise<Partial<IntentfulTask>[]>

    filter_entity_spec(
        user: UserAuthInfo,
        kind_name: string,
        fields: any,
        exact_match: boolean,
        sortParams?: SortParams,
    ): Promise<[Metadata, Spec][]>

    filter_entity_status(
        user: UserAuthInfo,
        kind_name: string,
        fields: any,
        exact_match: boolean,
        sortParams?: SortParams,
    ): Promise<[Metadata, Status][]>

    update_entity_spec(
        user: UserAuthInfo,
        uuid: uuid4,
        prefix: string,
        spec_version: number,
        extension: {[key: string]: any},
        kind_name: string,
        version: Version,
        spec_description: Spec,
    ): Promise<IntentfulTask | null>

    delete_entity_spec(
        user: UserAuthInfo,
        prefix: string,
        version: Version,
        kind_name: string,
        entity_uuid: uuid4,
    ): Promise<void>

    call_procedure(
        user: UserAuthInfo,
        prefix: string,
        kind_name: string,
        version: Version,
        entity_uuid: uuid4,
        procedure_name: string,
        input: any,
    ): Promise<any>

    call_kind_procedure(
        user: UserAuthInfo,
        prefix: string,
        kind_name: string,
        version: Version,
        procedure_name: string,
        input: any,
    ): Promise<any>

    call_provider_procedure(
        user: UserAuthInfo,
        prefix: string,
        version: Version,
        procedure_name: string,
        input: any,
    ): Promise<any>

    check_permission(
        user: UserAuthInfo,
        prefix: string,
        version: Version,
        entityAction: [Action, Entity_Reference][],
    ): Promise<OperationSuccess>
}

export interface OperationSuccess {
    success: string
}
