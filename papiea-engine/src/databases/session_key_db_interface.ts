import { SessionKey, Secret } from "papiea-core";

export interface SessionKeyDb {

    create_key(sessionKey: SessionKey): Promise<void>;

    get_key(key: Secret): Promise<SessionKey>;

    inactivate_key(key: Secret): Promise<void>;

    update_key(key: Secret, query: any): Promise<void>
}
