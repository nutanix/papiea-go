import { SessionKeyDb } from "../databases/session_key_db_interface"
import { UserAuthInfo, UserAuthInfoExtractor } from "./authn"
import { PapieaEngineTags, SessionKey, Secret } from "papiea-core"
import { Provider_DB } from "../databases/provider_db_interface"
import { getOAuth2 } from "./oauth2"
import { PapieaException } from "../errors/papiea_exception"
import { Logger } from "papiea-backend-utils"

export class SessionKeyAPI {
    private static EXPIRATION_WINDOW_IN_SECONDS = 300
    private readonly sessionKeyDb: SessionKeyDb
    private logger: Logger

    constructor(logger: Logger, sessionKeyDb: SessionKeyDb) {
        this.sessionKeyDb = sessionKeyDb
        this.logger = logger
    }

    async createKey(userInfo: UserAuthInfo, token: any, key: Secret, oauth2: any, provider_prefix: string, provider_version: string): Promise<SessionKey> {
        this.logger.debug(`BEGIN ${this.createKey.name} for session key API`, { tags: [PapieaEngineTags.Auth] })
        const exp = token.token.expires_at.getTime()
        const sessionKey: SessionKey = {
            key: key,
            expireAt: new Date(exp),
            user_info: userInfo,
            idpToken: token
        }
        await this.sessionKeyDb.create_key(sessionKey)
        if (SessionKeyAPI.isExpired(token)) {
            const refreshedKey = await this.refreshKey(sessionKey, oauth2, provider_prefix, provider_version)
            this.logger.debug(`END ${this.createKey.name} for session key API`, { tags: [PapieaEngineTags.Auth] })
            return refreshedKey
        }
        this.logger.debug(`END ${this.createKey.name} for session key API`, { tags: [PapieaEngineTags.Auth] })
        return sessionKey
    }

    async getKey(key: Secret, oauth2: any, provider_prefix: string, provider_version: string): Promise<SessionKey> {
        this.logger.debug(`BEGIN ${this.getKey.name} for session key API`, { tags: [PapieaEngineTags.Auth] })
        const sessionKey = await this.sessionKeyDb.get_key(key)
        if (SessionKeyAPI.isExpired(sessionKey.idpToken)) {
            const refreshedKey =  await this.refreshKey(sessionKey, oauth2, provider_prefix, provider_version)
            this.logger.debug(`END ${this.getKey.name} for session key API`, { tags: [PapieaEngineTags.Auth] })
            return refreshedKey
        } else {
            this.logger.debug(`END ${this.getKey.name} for session key API`, { tags: [PapieaEngineTags.Auth] })
            return sessionKey
        }
    }

    static isExpired(token: any): boolean {
        const exp = token.token.expires_at.getTime()
        const nowInSeconds = (new Date()).getTime();
        const expirationWindowStart = exp - SessionKeyAPI.EXPIRATION_WINDOW_IN_SECONDS;
        return nowInSeconds >= expirationWindowStart;
    }

    async inactivateKey(key: string) {
        return this.sessionKeyDb.inactivate_key(key)
    }

    async refreshKey(sessionKey: SessionKey, oauth2: any, provider_prefix: string, provider_version: string): Promise<SessionKey> {
        try {
            this.logger.debug(`BEGIN ${this.refreshKey.name} for session key API`, { tags: [PapieaEngineTags.Auth] })
            const token = {
                access_token: sessionKey.idpToken.token.access_token,
                refresh_token: sessionKey.idpToken.token.refresh_token,
                expires_in: sessionKey.idpToken.token.expires_in
            }
            let accessToken = oauth2.accessToken.create(token);
            accessToken = await accessToken.refresh();
            const exp = accessToken.token.expires_at.getTime()
            await this.sessionKeyDb.update_key(sessionKey.key, {
                idpToken: accessToken,
                expireAt: new Date(exp)
            })
            sessionKey.idpToken = accessToken
            this.logger.debug(`END ${this.refreshKey.name} for session key API`, { tags: [PapieaEngineTags.Auth] })
            return sessionKey
        } catch (e) {
            throw new PapieaException(`Couldn't refresh the session token for user on provider ${provider_prefix}/${provider_version} due to error: ${e.message}`, {provider_prefix: provider_prefix, provider_version: provider_version, additional_info: { "user": JSON.stringify(sessionKey.user_info) }})
        }
    }
}

export class SessionKeyUserAuthInfoExtractor implements UserAuthInfoExtractor {
    private readonly sessionKeyApi: SessionKeyAPI
    private readonly providerDb: Provider_DB
    private logger: Logger

    constructor(logger: Logger, sessionKeyApi: SessionKeyAPI, providerDb: Provider_DB) {
        this.sessionKeyApi = sessionKeyApi
        this.providerDb = providerDb
        this.logger = logger
    }

    async getUserAuthInfo(token: Secret, provider_prefix: string, provider_version: string): Promise<UserAuthInfo | null> {
        try {
            this.logger.debug(`BEGIN ${this.getUserAuthInfo.name} for session key`, { tags: [PapieaEngineTags.Auth] })
            const provider = await this.providerDb.get_provider(provider_prefix, provider_version)
            const oauth2 = getOAuth2(provider);
            const sessionKey = await this.sessionKeyApi.getKey(token, oauth2, provider_prefix, provider_version)
            const user_info = sessionKey.user_info
            delete user_info.is_admin
            this.logger.debug(`END ${this.getUserAuthInfo.name} for session key`, { tags: [PapieaEngineTags.Auth] })
            return user_info
        } catch (e) {
            this.logger.error(`While trying to authenticate with IDP error occurred for provider with prefix: ${provider_prefix} and version: ${provider_version} due to error: ${e}`)
            this.logger.debug(`END ${this.getUserAuthInfo.name} for session key`, { tags: [PapieaEngineTags.Auth] })
            return null
        }
    }
}