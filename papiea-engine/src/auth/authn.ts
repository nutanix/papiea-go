import { NextFunction, Request, Response, Router } from "express";
import { S2S_Key_DB } from "../databases/s2skey_db_interface";
import { Provider, S2S_Key, Version } from "papiea-core";
import { Provider_DB } from "../databases/provider_db_interface";
import { getUserInfoFromToken } from "./oauth2";
import { UnauthorizedError } from "../errors/permission_error";
import atob = require("atob");


interface AuthenticationStrategy {
    getUserAuthInfo(token: string): Promise<UserAuthInfo | null>
}

class IdpAuthenticationStrategy implements AuthenticationStrategy {
    private readonly providerDb: Provider_DB;
    private readonly provider_prefix?: string;
    private readonly provider_version?: Version;

    constructor(providerDb: Provider_DB, provider_prefix?: string, provider_version?: string) {
        this.providerDb = providerDb;
        this.provider_prefix = provider_prefix;
        this.provider_version = provider_version;
    }

    async getUserAuthInfo(token: string): Promise<UserAuthInfo | null> {
        try {
            if (!this.provider_prefix || !this.provider_version) {
                return null;
            }
            console.log(JSON.parse(atob(token)));
            const provider: Provider = await this.providerDb.get_provider(this.provider_prefix, this.provider_version);
            const userInfo = getUserInfoFromToken(JSON.parse(atob(token)), provider);
            userInfo.provider_prefix = this.provider_prefix;
            userInfo.provider_version = this.provider_version;
            console.log(userInfo.authorization);
            delete userInfo.is_admin;
            return userInfo;
        } catch (e) {
            console.error(`While trying to authenticate with IDP error: '${e}' occurred`);
            return null;
        }
    }
}

class AdminAuthenticationStrategy implements AuthenticationStrategy {
    private readonly adminKey: string;

    constructor(adminKey: string) {
        this.adminKey = adminKey;
    }

    async getUserAuthInfo(token: string): Promise<UserAuthInfo | null> {
        if (token === this.adminKey) {
            return { is_admin: true }
        } else {
            return null;
        }
    }
}

class S2SKeyAuthenticationStrategy implements AuthenticationStrategy {
    private readonly s2skeyDb: S2S_Key_DB;

    constructor(s2skeyDb: S2S_Key_DB) {
        this.s2skeyDb = s2skeyDb;
    }

    async getUserAuthInfo(token: string): Promise<UserAuthInfo | null> {
        try {
            const s2skey: S2S_Key = await this.s2skeyDb.get_key(token);
            const userInfo = s2skey.userInfo;
            userInfo.authorization = 'Bearer ' + s2skey.key;
            return userInfo;
        } catch (e) {
            return null;
        }
    }
}


class AuthenticationContext {
    private authStrategies: AuthenticationStrategy[] = [];
    protected token: string;


    // TODO: I.Korotach maybe introduce a DI factory
    constructor(token: string, adminKey: string, s2skeyDb: S2S_Key_DB, providerDb: Provider_DB, provider_prefix: string, provider_version: Version) {
        this.token = token;
        this.authStrategies = [
            new AdminAuthenticationStrategy(adminKey),
            new S2SKeyAuthenticationStrategy(s2skeyDb),
            new IdpAuthenticationStrategy(providerDb, provider_prefix, provider_version)
        ]
    }

    async getUserAuthInfo(): Promise<UserAuthInfo> {
        let userAuthInfo: UserAuthInfo | null = null;
        let i = 0;
        while (userAuthInfo === null && i < this.authStrategies.length) {
            userAuthInfo = await this.authStrategies[i].getUserAuthInfo(this.token);
            i++;
        }
        if (userAuthInfo !== null) {
            return userAuthInfo;
        } else {
            throw new UnauthorizedError();
        }
    }

}

export interface UserAuthInfoRequest extends Request {
    user: UserAuthInfo
}

export interface UserAuthInfo {
    [key: string]: any;
}
export interface UserAuthRequestHandler {
    (req: UserAuthInfoRequest, res: Response, next: NextFunction): any;
}

export function asyncHandler(fn: UserAuthRequestHandler): any {
    return (req: Request, res: Response, next: NextFunction) => {
        let requestWrapper: UserAuthInfoRequest = <UserAuthInfoRequest>req;
        const fnReturn = fn(requestWrapper, res, next);
        return Promise.resolve(fnReturn).catch(next);
    };
}

function getToken(req: any): string | null {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    } else if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    return null;
}

export function createAuthnRouter(adminKey: string, s2skeyDb: S2S_Key_DB, providerDb: Provider_DB): Router {

    const router = Router();

    async function injectUserInfo(req: UserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> {
        const token = getToken(req);
        if (token === null) {
            return next();
        }
        const urlParts = req.originalUrl.split('/');
        const provider_prefix: string | undefined = urlParts[2];
        const provider_version: Version | undefined = urlParts[3];
        const AuthCtx = new AuthenticationContext(token, adminKey, s2skeyDb, providerDb, provider_prefix, provider_version);

        const userInfo = await AuthCtx.getUserAuthInfo();

        if (urlParts.length > 1) {
            if (provider_prefix
                // TODO: probably need to change /provider/update_status to /provider/:prefix/:version/update_status
                && provider_prefix !== "update_status"
                && userInfo.provider_prefix !== provider_prefix
                && !userInfo.is_admin) {
                throw new UnauthorizedError();
            }
        }
        req.user = userInfo;
        next();
    }

    router.use('/services/:prefix', asyncHandler(injectUserInfo));
    router.use('/provider/', asyncHandler(injectUserInfo));

    router.use('/provider/:prefix/:version/auth/user_info', asyncHandler(async (req, res) => {
        res.json(req.user);
    }));

    return router;
}