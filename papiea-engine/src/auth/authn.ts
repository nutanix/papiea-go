import { NextFunction, Request, Response, Router } from "express";
import { UnauthorizedError } from "../errors/permission_error";
import { PapieaEngineTags, Secret } from "papiea-core"
import { Logger } from 'papiea-backend-utils'

export interface UserAuthInfoExtractor {
    getUserAuthInfo(token: Secret, provider_prefix?: string, provider_version?: string): Promise<UserAuthInfo | null>
}

export class CompositeUserAuthInfoExtractor implements UserAuthInfoExtractor {
    private readonly extractors: UserAuthInfoExtractor[];

    constructor(extractors: UserAuthInfoExtractor[]) {
        this.extractors = extractors;
    }

    async getUserAuthInfo(token: Secret, provider_prefix?: string, provider_version?: string): Promise<UserAuthInfo | null> {
        let userAuthInfo: UserAuthInfo | null = null;
        let i = 0;
        while (userAuthInfo === null && i < this.extractors.length) {
            userAuthInfo = await this.extractors[i].getUserAuthInfo(token, provider_prefix, provider_version);
            i++;
        }
        return userAuthInfo;
    }
}


export class AdminUserAuthInfoExtractor implements UserAuthInfoExtractor {
    private readonly adminKey: Secret;
    private logger: Logger

    constructor(logger: Logger, adminKey: Secret) {
        this.adminKey = adminKey;
        this.logger = logger
    }

    async getUserAuthInfo(token: Secret, provider_prefix?: string, provider_version?: string): Promise<UserAuthInfo | null> {
        this.logger.debug(`BEGIN ${this.getUserAuthInfo.name} for admin`, { tags: [PapieaEngineTags.Auth] })
        if (token === this.adminKey) {
            this.logger.debug(`END ${this.getUserAuthInfo.name} for admin`, { tags: [PapieaEngineTags.Auth] })
            return { is_admin: true }
        } else {
            this.logger.debug(`END ${this.getUserAuthInfo.name} for admin`, { tags: [PapieaEngineTags.Auth] })
            return null;
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
        return req.headers.authorization.split(' ')[1] || '';
    } else if (req.query && req.query.token) {
        return req.query.token;
    } else if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    return null;
}

export function createAuthnRouter(logger: Logger, userAuthInfoExtractor: UserAuthInfoExtractor): Router {

    const router = Router();

    async function injectUserInfo(req: UserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> {
        logger.debug(`BEGIN ${injectUserInfo.name}`, { tags: [PapieaEngineTags.Auth] })
        const token = getToken(req);
        if (token === null) {
            return next();
        }
        const urlParts = req.originalUrl.split('/');
        const provider_prefix: string | undefined = urlParts[2];
        const provider_version: string | undefined = urlParts[3];
        const endpoint_path: string | undefined = urlParts[4];

        const user_info = await userAuthInfoExtractor.getUserAuthInfo(token, provider_prefix, provider_version);
        if (user_info === null) {
            throw new UnauthorizedError(`Failed to get user info token on provider ${provider_prefix}/${provider_version}`, { provider_prefix: provider_prefix, provider_version: provider_version, additional_info: { "user_token": token }})
        }
        if (urlParts.length > 1) {
            if (provider_prefix
                && endpoint_path !== "update_status"
                && (user_info.provider_prefix !== undefined && user_info.provider_prefix !== provider_prefix)
                && !user_info.is_admin) {
                throw new UnauthorizedError(`Invalid user info found for the token on provider ${provider_prefix}/${provider_version}`, { provider_prefix: provider_prefix, provider_version: provider_version, additional_info: { "user_token": token }});
            }
        }
        req.user = user_info;
        next();
        logger.debug(`END ${injectUserInfo.name}`, { tags: [PapieaEngineTags.Auth] })
    }

    router.use('/services/:prefix', asyncHandler(injectUserInfo));
    router.use('/provider/', asyncHandler(injectUserInfo));

    router.use('/provider/:prefix/:version/auth/user_info', asyncHandler(async (req, res) => {
        res.json(req.user);
    }));

    return router;
}
