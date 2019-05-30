
export type Key = string;

export interface S2S_Key {
    name: string;
    user_id: string;
    provider_prefix: string;
    key: Key;

    // Additional fields
    created_at: Date;
    deleted_at?: Date;
    extension: {
        [key: string]: any;
    }
}

export interface S2S_Key_DB {

    create_key(s2skey: S2S_Key): Promise<void>;

    get_key(key: Key): Promise<S2S_Key>;

    list_keys(fields_map: any): Promise<S2S_Key[]>;

    inactivate_key(key: Key): Promise<void>;
}
