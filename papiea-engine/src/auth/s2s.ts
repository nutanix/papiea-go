import { UserAuthInfo, UserAuthInfoExtractor } from "./authn";
import { S2S_Key_DB } from "../databases/s2skey_db_interface";
import { PapieaEngineTags, S2S_Key, Secret } from "papiea-core";
import { Logger } from "papiea-backend-utils";


export class S2SKeyUserAuthInfoExtractor implements UserAuthInfoExtractor {
    private readonly s2skeyDb: S2S_Key_DB;
    private logger: Logger

    constructor(logger: Logger, s2skeyDb: S2S_Key_DB) {
        this.s2skeyDb = s2skeyDb;
        this.logger = logger
    }

    async getUserAuthInfo(token: Secret, provider_prefix?: string, provider_version?: string): Promise<UserAuthInfo | null> {
        try {
            this.logger.debug(`BEGIN ${this.getUserAuthInfo.name} for S2S key`, { tags: [PapieaEngineTags.Auth] })
            const s2skey: S2S_Key = await this.s2skeyDb.get_key_by_secret(token);
            const user_info = s2skey.user_info;
            user_info.provider_prefix = s2skey.provider_prefix;
            user_info.authorization = 'Bearer ' + s2skey.key;
            this.logger.debug(`END ${this.getUserAuthInfo.name} for S2S key`, { tags: [PapieaEngineTags.Auth] })
            return user_info;
        } catch (e) {
            this.logger.debug(`END ${this.getUserAuthInfo.name} for S2S key`, { tags: [PapieaEngineTags.Auth] })
            return null;
        }
    }
}