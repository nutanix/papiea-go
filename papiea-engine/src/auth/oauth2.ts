import { NextFunction, Response, Router } from "express";
import { asyncHandler, UnauthorizedError, UserAuthInfo, UserAuthInfoRequest } from "./authn";
import { Signature } from "./crypto";
import { Provider_DB } from "../databases/provider_db_interface";
import { extract_property } from "./user_data_evaluator";
import { Provider } from "papiea-core/build/core";

const simpleOauthModule = require("simple-oauth2"),
    queryString = require("query-string"),
    url = require("url");

// !!!!!!!!!!!! TODO(adolgarev): below is provider specific function !!!!!!!!!!!!
// See https://github.com/nutanix/papiea-js/pull/94

function convertToSimpleOauth2(description: any) {
    const oauth = description.oauth;

    const simple_oauth_config = {
        client: {
            id: oauth.client_id,
            secret: oauth.client_secret
        },
        auth: {
            tokenHost: oauth.auth_host,
            tokenPath: oauth.token_uri,
            authorizePath: oauth.authorize_uri,
            revokePath: oauth.revoke_uri
        },
        options: {
            authorizationMethod: "body",
            bodyFormat: "form"
        }
    };
    return simple_oauth_config;
}

function getOAuth2(provider: Provider) {
    const converted_oauth = convertToSimpleOauth2(provider.oauth2);
    return simpleOauthModule.create(converted_oauth);
}

function getUserInfoFromToken(token: any, provider: Provider): UserAuthInfo {

    const extracted_headers = extract_property(token, provider.oauth2, "headers");

    const userInfo: UserAuthInfo = {...extracted_headers};

    return userInfo;
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

export function createOAuth2Router(redirect_uri: string, signature: Signature, providerDb: Provider_DB) {
    const router = Router();

    router.use('/provider/:prefix/:version/auth/login', asyncHandler(async (req, res) => {
        const provider: Provider = await providerDb.get_provider(req.params.prefix, req.params.version);
        const oauth2 = getOAuth2(provider);
        const state = {
            provider_prefix: provider.prefix,
            provider_version: provider.version,
            redirect_uri: req.query.redirect_uri
        };
        const options = {
            redirect_uri: redirect_uri,
            state: queryString.stringify(state),
            scope: "openid"
            // prompt: "login"
        };
        const authorizationUri = oauth2.authorizationCode.authorizeURL(options);
        res.redirect(authorizationUri);
    }));

    router.use(url.parse(redirect_uri).path, asyncHandler(async (req, res, next) => {
        const code = req.query.code;
        const state = queryString.parse(req.query.state);
        const provider: Provider = await providerDb.get_provider(state.provider_prefix, state.provider_version);
        const oauth2 = getOAuth2(provider);
        try {
            const result = await oauth2.authorizationCode.getToken({
                code,
                redirect_uri
            });
            const token = oauth2.accessToken.create(result);
            const userInfo = getUserInfoFromToken(token, provider);
            userInfo.provider_prefix = state.provider_prefix;
            userInfo.provider_version = state.provider_version;
            const newSignedToken = await signature.sign(userInfo);
            if (state.redirect_uri) {
                const client_url = new url.URL(state.redirect_uri);
                client_url.searchParams.append("token", newSignedToken);
                return res.redirect(client_url.toString());
            } else {
                return res.status(200).json({ token: newSignedToken });
            }
        } catch (error) {
            console.error('Access Token Error', error.message);
            return res.status(500).json('Authentication failed');
        }
    }));

    async function injectUserInfo(req: UserAuthInfoRequest, res: Response, next: NextFunction): Promise<void> {
        const token = getToken(req);
        if (token === null) {
            return next();
        }
        let userInfo: UserAuthInfo;
        try {
            userInfo = await signature.verify(token);
        } catch (e) {
            throw new UnauthorizedError();
        }
        if (userInfo.provider_prefix !== req.params.prefix) {
            throw new UnauthorizedError();
        }
        req.user = userInfo;
        next();
    }

    router.use('/services/:prefix', asyncHandler(injectUserInfo));
    router.use('/provider/:prefix', asyncHandler(injectUserInfo));

    router.use('/provider/:prefix/:version/auth/user_info', asyncHandler(async (req, res) => {
        res.json(req.user);
    }));

    return router;
}