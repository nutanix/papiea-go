import { UserAuthInfo } from "../auth/authn";
import { Provider, Version, Entity_Reference, Status } from "papiea-core/build/core";



// This will be provided using REST APIs. 

export enum Provider_Power { On, Off, Suspended }

export interface Provider_API {

    // Registers a provider to the Provider's DB
    // POST "/provider"
    register_provider(user: UserAuthInfo, provider: Provider): Promise<void>;

    // DELETE "/provider/{prefix}/{version}"
    unregister_provider(user: UserAuthInfo, provider_prefix: string, version: Version): Promise<void>;

    // Replace status with a specified one
    replace_status(user: UserAuthInfo, context: any, entity_ref: Entity_Reference, status: Status): Promise<void>;

    // POST "/provider/update_progress"
    update_progress(user: UserAuthInfo, context: any, message: string, done_percent: number): Promise<void>;

    // Binny wants to rename this
    // POST "/provider/{prefix}/{version}/power"
    power(user: UserAuthInfo, provider_prefix: string, version: Version, power_state: Provider_Power): Promise<void>;

    get_latest_provider_by_kind(user: UserAuthInfo, kind_name: string): Promise<Provider>;

    get_provider(user: UserAuthInfo, provider_prefix: string, provider_version: Version): Promise<Provider>;

    list_providers_by_prefix(user: UserAuthInfo, provider_prefix: string): Promise<Provider[]>;

    get_latest_provider(user: UserAuthInfo, provider_prefix: string): Promise<Provider>

    update_auth(user: UserAuthInfo, provider_prefix: string, provider_version: Version, policy: string): Promise<void>;

    on_auth_change(callbackfn: (provider: Provider) => void): void;

    // Updating status
    // POST "/provider/update_status"
    update_status(user: UserAuthInfo, context: any, entity_ref: Entity_Reference, status: Status): Promise<void>
}
