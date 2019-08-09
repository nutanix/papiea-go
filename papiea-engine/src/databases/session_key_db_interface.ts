import { SessionKey } from "papiea-core";

export interface SessionKeyDb {

    create_key(sessionKey: SessionKey): Promise<void>;

    get_key(key: string): Promise<SessionKey>;

    inactivate_key(key: string): Promise<void>;

}
