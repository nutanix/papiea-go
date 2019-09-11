import { S2S_Key, Secret } from "papiea-core";

export interface S2S_Key_DB {

    create_key(s2skey: S2S_Key): Promise<void>;

    get_key(uuid: string): Promise<S2S_Key>;

    get_key_by_secret(secret: Secret): Promise<S2S_Key>;

    list_keys(fields_map: any): Promise<S2S_Key[]>;

    inactivate_key(uuid: string): Promise<void>;
}
