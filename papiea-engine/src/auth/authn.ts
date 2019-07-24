import { Request, Response, NextFunction, Router } from "express";
import { Signature } from "./crypto";
import { S2S_Key_DB } from "../databases/s2skey_db_interface";
import { S2S_Key, Version, Provider } from "papiea-core";
import { Provider_DB } from "../databases/provider_db_interface";
import { getUserInfoFromToken } from "./oauth2";
import atob = require("atob");
import { constructBearerTokenPath } from "./user_data_evaluator";

export class UnauthorizedError extends Error {
    constructor() {
        super("Unauthorized");
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

interface AuthenticationStrategy {
    getUserAuthInfo(token: string): Promise<UserAuthInfo | null>
}

class PapieaAuthenticationStrategy implements AuthenticationStrategy {
    private readonly sig: Signature;

    constructor(sig: Signature) {
        this.sig = sig;
    }

    async getUserAuthInfo(token: string): Promise<UserAuthInfo | null> {
        try {
            return await this.sig.verify(token);
        } catch (e) {
            return null;
        }
    }
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
            const provider: Provider = await this.providerDb.get_provider(this.provider_prefix, this.provider_version);
            // TODO: I don't like this, should ask Shlomi
            // This may be via API call with access token to IDP to get id_token.
            // But how do we know that we need 'id_token'?
            const bearerTokenField = provider.oauth2.oauth.user_info.headers.authorization;
            const userInfo = getUserInfoFromToken(constructBearerTokenPath(bearerTokenField, token), provider);
            userInfo.provider_prefix = this.provider_prefix;
            userInfo.provider_version = this.provider_version;
            delete userInfo.is_admin;
            return userInfo;
        } catch (e) {
            console.error(e);
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
            const userInfo = s2skey.extension;
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
    constructor(token: string, adminKey: string, s2skeyDb: S2S_Key_DB, signature: Signature, providerDb: Provider_DB, provider_prefix: string, provider_version: Version) {
        this.token = token;
        this.authStrategies = [
            new AdminAuthenticationStrategy(adminKey),
            new PapieaAuthenticationStrategy(signature),
            new S2SKeyAuthenticationStrategy(s2skeyDb),
            new IdpAuthenticationStrategy(providerDb, provider_prefix, provider_version)
        ]
    }

    async getUserAuthInfo(): Promise<UserAuthInfo> {
        let userAuthInfo: UserAuthInfo | null = null;
        let i = 0;
        console.log(this.authStrategies.length);
        while (userAuthInfo === null && i < this.authStrategies.length) {
            userAuthInfo = await this.authStrategies[i].getUserAuthInfo(this.token);
            i++;
            console.log(i);
            console.log(userAuthInfo);
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

export function createAuthnRouter(adminKey: string, signature: Signature, s2skeyDb: S2S_Key_DB, providerDb: Provider_DB): Router {

    const router = Router();

    async function injectUserInfo(req: UserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> {
        const token = getToken(req);
        if (token === null) {
            return next();
        }
        const urlParts = req.originalUrl.split('/');
        const provider_prefix: string | undefined = urlParts[2];
        const provider_version: Version | undefined = urlParts[3];
        const AuthCtx = new AuthenticationContext(token, adminKey, s2skeyDb, signature, providerDb, provider_prefix, provider_version);

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