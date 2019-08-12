import { SessionKeyDb } from "../databases/session_key_db_interface"
import { UserAuthInfo, UserAuthInfoExtractor } from "./authn"
import { SessionKey } from "papiea-core"

export class SessionKeyAPI {
    private static EXPIRATION_WINDOW_IN_SECONDS = 300
    private readonly sessionKeyDb: SessionKeyDb

    constructor(sessionKeyDb: SessionKeyDb) {
        this.sessionKeyDb = sessionKeyDb
    }

    async createKey(userInfo: UserAuthInfo, token: any, key: string): Promise<SessionKey> {
        const exp = token.token.expires_at.getTime()
        const sessionKey: SessionKey = {
            key: key,
            expireAt: new Date(exp),
            user_info: userInfo,
            idpToken: token
        }
        await this.sessionKeyDb.create_key(sessionKey)
        if (SessionKeyAPI.isExpired(token)) {
            return await this.refreshKey(sessionKey)
        }
        return sessionKey
    }

    async getKey(key: string): Promise<SessionKey> {
        const sessionKey = await this.sessionKeyDb.get_key(key)
        if (SessionKeyAPI.isExpired(sessionKey.idpToken)) {
            return await this.refreshKey(sessionKey)
        } else {
            return sessionKey
        }
    }

    static isExpired(token: any): boolean {
        const exp = token.token.expires_at.getTime()
        const nowInSeconds = (new Date()).getTime() / 1000;
        const expirationWindowStart = exp - SessionKeyAPI.EXPIRATION_WINDOW_IN_SECONDS;
        return nowInSeconds >= expirationWindowStart;
    }

    async inActivateKey(key: string) {
        return this.sessionKeyDb.inactivate_key(key)
    }

    async refreshKey(sessionKey: SessionKey): Promise<SessionKey> {
        try {
            const token = await sessionKey.idpToken.refresh()
            const exp = token.token.expires_at.getTime()
            await this.sessionKeyDb.update_key(sessionKey.key, {
                token: token,
                expireAt: new Date(exp)
            })
            sessionKey.idpToken = token
            return sessionKey
        } catch (e) {
            throw new Error(`Couldn't refresh the token: ${e.message}`)
        }
    }
}

export class SessionKeyUserAuthInfoExtractor implements UserAuthInfoExtractor {
    private readonly sessionKeyApi: SessionKeyAPI

    constructor(sessionKeyApi: SessionKeyAPI) {
        this.sessionKeyApi = sessionKeyApi
    }

    async getUserAuthInfo(token: string): Promise<UserAuthInfo | null> {
        try {
            const sessionKey = await this.sessionKeyApi.getKey(token)
            const user_info = sessionKey.user_info
            delete user_info.is_admin
            return user_info
        } catch (e) {
            console.error(`While trying to authenticate with IDP error: '${ e }' occurred`)
            return null
        }
    }
}