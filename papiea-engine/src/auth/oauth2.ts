import { Router } from "express";
import { asyncHandler, UserAuthInfo } from "./authn";
import { Signature } from "./crypto";
import { Provider_DB } from "../databases/provider_db_interface";
import { extract_property } from "./user_data_evaluator";
import { Provider } from "papiea-core";

const simpleOauthModule = require("simple-oauth2"),
    queryString = require("query-string"),
    url = require("url");

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

export function createOAuth2Router(redirect_uri: string, signature: Signature, providerDb: Provider_DB): Router {
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

    router.use('/provider/:prefix/:version/auth/logout'), asyncHandler(async (req, res) => {
        const provider: Provider = await providerDb.get_provider(req.params.prefix, req.params.version);
        const oauth2 = getOAuth2(provider);
        await oauth2.accessToken.revokeAll();
        res.redirect('/');
    }) 

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
            delete userInfo.is_admin;
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

    return router;
}