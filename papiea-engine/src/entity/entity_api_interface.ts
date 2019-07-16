import { UserAuthInfo } from "../auth/authn";
import { Version, Spec, Metadata, uuid4, Status } from "papiea-core";
import { SortParams } from "../utils/utils";

export interface Entity_API {
    save_entity(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, spec_description: Spec, request_metadata: Metadata): Promise<[Metadata, Spec]>

    get_entity_spec(user: UserAuthInfo, kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Spec]>

    get_entity_status(user: UserAuthInfo, kind_name: string, entity_uuid: uuid4): Promise<[Metadata, Status]>

    filter_entity_spec(user: UserAuthInfo, kind_name: string, fields: any, sortParams: SortParams): Promise<[Metadata, Spec][]>

    filter_entity_status(user: UserAuthInfo, kind_name: string, fields: any, sortParams: SortParams): Promise<[Metadata, Status][]>

    update_entity_spec(user: UserAuthInfo, uuid: uuid4, prefix: string, spec_version: number, extension: {[key: string]: any}, kind_name: string, version: Version, spec_description: Spec): Promise<[Metadata, Spec]>

    delete_entity_spec(user: UserAuthInfo, kind_name: string, entity_uuid: uuid4): Promise<void>

    call_procedure(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, entity_uuid: uuid4, procedure_name: string, input: any): Promise<any>

    call_kind_procedure(user: UserAuthInfo, prefix: string, kind_name: string, version: Version, procedure_name: string, input: any): Promise<any>

    call_provider_procedure(user: UserAuthInfo, prefix: string, version: Version, procedure_name: string, input: any): Promise<any>
}