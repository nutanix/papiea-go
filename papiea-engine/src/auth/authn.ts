import { Request, Response, NextFunction, Router } from "express";
import { Signature } from "./crypto";
import { S2S_Key_DB } from "../databases/s2skey_db_interface";
import { S2S_Key } from "papiea-core";

export class UnauthorizedError extends Error {
    constructor() {
        super("Unauthorized");
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
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

export function createAuthnRouter(adminKey: string, signature: Signature, s2skeyDb: S2S_Key_DB): Router {

    const router = Router();

    async function injectUserInfo(req: UserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> {
        const token = getToken(req);
        if (token === null) {
            return next();
        }
        let userInfo: UserAuthInfo;
        
        if (token === adminKey) {
            userInfo = { is_admin: true };
        } else {
            try {
                userInfo = await signature.verify(token);
                userInfo.authorization = req.headers.authorization;
            } catch (e) {
                try {
                    const s2skey: S2S_Key = await s2skeyDb.get_key(token);
                    userInfo = s2skey.extension;
                    userInfo.authorization = 'Bearer ' + s2skey.key;
                } catch (e) {
                    throw new UnauthorizedError();
                }
            }
        }

        const urlParts = req.originalUrl.split('/');
        if (urlParts.length > 1) {
            const providerPrefix = urlParts[2];
            if (providerPrefix
                // TODO: probably need to change /provider/update_status to /provider/:prefix/:version/update_status
                && providerPrefix !== "update_status"
                && userInfo.provider_prefix !== providerPrefix
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