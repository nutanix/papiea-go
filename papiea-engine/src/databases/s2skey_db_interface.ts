import { S2S_Key, Key } from "papiea-core";

export interface S2S_Key_DB {

    create_key(s2skey: S2S_Key): Promise<void>;

    get_key(key: Key): Promise<S2S_Key>;

    list_keys(fields_map: any): Promise<S2S_Key[]>;

    inactivate_key(key: Key): Promise<void>;
}
