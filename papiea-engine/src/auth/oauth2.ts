import { Router } from "express"
import { asyncHandler, UserAuthInfo } from "./authn"
import { Provider_DB } from "../databases/provider_db_interface"
import { atob, extract_property } from "./user_data_evaluator"
import { Provider } from "papiea-core"
import Logger from "../logger_interface"
import { SessionKeyAPI, SessionKeyUserAuthInfoExtractor } from "./session_key"
import uuid = require("uuid")

const simpleOauthModule = require("simple-oauth2"),
    queryString = require("query-string"),
    url = require("url");


function getUserInfoFromToken(token: any, provider: Provider): UserAuthInfo {
    const extracted_headers = extract_property({ token }, provider.oauth2, "headers")
    const user_info: UserAuthInfo = { ...extracted_headers }
    return user_info
}


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

function parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}


export function createOAuth2Router(logger: Logger, redirect_uri: string, providerDb: Provider_DB, sessionKeyAPI: SessionKeyAPI): Router {
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
            scope: "openid",
        };
        const authorizationUri = oauth2.authorizationCode.authorizeURL(options);
        res.redirect(authorizationUri);
    }));

    router.use('/provider/:prefix/:version/auth/logout', asyncHandler(async (req, res) => {
        try {
            await sessionKeyAPI.inActivateKey(req.user.authorization.split(' ')[1])
        } catch (e) {
            return res.status(400).json("failed");
        }
        return res.status(200).json("OK");
    }));

    router.use('/provider/auth/callback', asyncHandler(async (req, res, next) => {
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
            const key = uuid()
            const userInfo = getUserInfoFromToken(token.token, provider)
            userInfo.authorization = `Bearer ${key}`
            const sessionKey = await sessionKeyAPI.createKey(userInfo, token, key)
            if (state.redirect_uri) {
                const client_url = new url.URL(state.redirect_uri);
                client_url.searchParams.append("token", sessionKey.key);
                return res.redirect(client_url.toString());
            } else {
                return res.status(200).json({ token: sessionKey.key });
            }
        } catch (error) {
            logger.error('Access Token Error', error.message);
            return res.status(500).json('Authentication failed');
        }
    }));

    return router;
}