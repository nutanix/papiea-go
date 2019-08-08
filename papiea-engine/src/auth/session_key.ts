import { SessionKeyDb } from "../databases/session_key_db_interface"
import { UserAuthInfo, UserAuthInfoExtractor } from "./authn"
import { SessionKey } from "papiea-core"
import { atob, parseJwt } from "./user_data_evaluator"
import uuid = require("uuid")

export class SessionKeyAPI {
    private readonly sessionKeyDb: SessionKeyDb

    constructor(sessionKeyDb: SessionKeyDb) {
        this.sessionKeyDb = sessionKeyDb
    }

    async createKey(userInfo: UserAuthInfo, token: any): Promise<SessionKey> {
        const parsedToken = parseJwt(token.token.access_token)
        const exp = parsedToken.content.exp
        const sessionKey: SessionKey = {
            key: uuid(),
            expireAt: new Date(exp * 1000),
            user_info: userInfo
        }
        if (SessionKeyAPI.isExpired(sessionKey)) {
            throw new Error("Access token expired")
        }
        await this.sessionKeyDb.create_key(sessionKey)
        return sessionKey
    }

    async getKey(key: string): Promise<SessionKey> {
        const sessionKey = await this.sessionKeyDb.get_key(key)
        if (!SessionKeyAPI.isExpired(sessionKey)) {
            return sessionKey
        } else {
            throw new Error("Access token expired")
        }
    }

    async inActivateKey(key: string) {
        return this.sessionKeyDb.inactivate_key(key)
    }

    static isExpired(sessionKey: SessionKey) {
        return new Date() >= new Date(sessionKey.expireAt)
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