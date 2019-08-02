import { Router } from "express";
import { asyncHandler, UserAuthInfo, UserAuthInfoExtractor } from "./authn";
import { Provider_DB } from "../databases/provider_db_interface";
import { extract_property } from "./user_data_evaluator";
import { Provider } from "papiea-core";
import btoa = require("btoa");
import atob = require("atob");

const simpleOauthModule = require("simple-oauth2"),
    queryString = require("query-string"),
    url = require("url");


export class IdpUserAuthInfoExtractor implements UserAuthInfoExtractor {
    private readonly providerDb: Provider_DB;

    constructor(providerDb: Provider_DB) {
        this.providerDb = providerDb;
    }

    getUserInfoFromToken(token: any, provider: Provider): UserAuthInfo {
        const extracted_headers = extract_property({ token }, provider.oauth2, "headers");
        const userInfo: UserAuthInfo = { ...extracted_headers };
        return userInfo;
    }

    async getUserAuthInfo(token: string, provider_prefix?: string, provider_version?: string): Promise<UserAuthInfo | null> {
        try {
            if (!provider_prefix || !provider_version) {
                return null;
            }
            const provider: Provider = await this.providerDb.get_provider(provider_prefix, provider_version);
            const userInfo = this.getUserInfoFromToken(JSON.parse(atob(token)), provider);
            delete userInfo.is_admin;
            return userInfo;
        } catch (e) {
            console.error(`While trying to authenticate with IDP error: '${e}' occurred`);
            return null;
        }
    }
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


export function createOAuth2Router(redirect_uri: string, providerDb: Provider_DB): Router {
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
        const provider: Provider = await providerDb.get_provider(req.params.prefix, req.params.version);
        const oauth2 = getOAuth2(provider);
        const token = oauth2.accessToken.create({ "access_token": req.user.authorization.split(' ')[1] });
        try {
            await token.revoke('access_token');
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
            const base64Token = btoa(JSON.stringify(token.token));
            if (state.redirect_uri) {
                const client_url = new url.URL(state.redirect_uri);
                client_url.searchParams.append("token", base64Token);
                return res.redirect(client_url.toString());
            } else {
                return res.status(200).json({ token: base64Token });
            }
        } catch (error) {
            console.error('Access Token Error', error.message);
            return res.status(500).json('Authentication failed');
        }
    }));

    return router;
}