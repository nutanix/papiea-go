import { Policy } from "papiea-core";

export interface Policy_DB {
    create_policy(policy: Policy): Promise<void>;

    get_policy(uuid: string): Promise<Policy>;

    list_policies(fields_map: any): Promise<Policy[]>;

    delete_policy(uuid: string): Promise<void>;

    update_policy(filter: any, update: any): Promise<void>;
}