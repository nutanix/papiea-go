import * as express from "express";
import { Provider_API, Provider_Power } from "./provider_api_interface";
import { asyncHandler } from '../auth/authn';
import { BadRequestError } from '../errors/bad_request_error';
import { CheckNoQueryParams, check_request } from "../validator/express_validator";
import { Logger } from "papiea-backend-utils";
import { PapieaEngineTags } from "papiea-core"

export default function createProviderAPIRouter(logger: Logger, providerApi: Provider_API, trace: Function) {
    const providerApiRouter = express.Router();

    providerApiRouter.post('/', CheckNoQueryParams, trace("register_provider"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for POST endpoint /`, { tags: [PapieaEngineTags.Provider] })
        const result = await providerApi.register_provider(req.user, req.body, res.locals.ctx);
        res.json(result);
        logger.debug(`END processing for POST endpoint /`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.get('/', CheckNoQueryParams, trace("list_providers"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for GET endpoint /`, { tags: [PapieaEngineTags.Provider] })
        const result = await providerApi.list_providers(req.user, res.locals.ctx);
        res.json(result);
        logger.debug(`END processing for GET endpoint /`, { tags: [PapieaEngineTags.Provider] })
    }))

    providerApiRouter.get('/:prefix/:version', CheckNoQueryParams, trace("get_provider"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for GET endpoint /:prefix/:version`, { tags: [PapieaEngineTags.Provider] })
        const provider = await providerApi.get_provider(req.user, req.params.prefix, req.params.version, res.locals.ctx);
        res.json(provider)
        logger.debug(`END processing for GET endpoint /:prefix/:version`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.delete('/:prefix/:version', CheckNoQueryParams, trace("unregister_provider"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for DELETE endpoint /:prefix/:version`, { tags: [PapieaEngineTags.Provider] })
        await providerApi.unregister_provider(req.user, req.params.prefix, req.params.version, res.locals.ctx);
        res.json("OK")
        logger.debug(`END processing for DELETE endpoint /:prefix/:version`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.get('/:prefix', CheckNoQueryParams, trace("list_provider_by_prefix"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for GET endpoint /:prefix`, { tags: [PapieaEngineTags.Provider] })
        const provider = await providerApi.list_providers_by_prefix(req.user, req.params.prefix, res.locals.ctx);
        res.json(provider)
        logger.debug(`END processing for GET endpoint /:prefix`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.post('/:prefix/:version/update_status', check_request({
        allowed_query_params: [],
        allowed_body_params: ['context', 'entity_ref', 'status']
    }), trace("replace_status"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for POST endpoint /:prefix/:version/update_status`, { tags: [PapieaEngineTags.Provider] })
        await providerApi.replace_status(req.user, req.params.prefix, req.params.version, req.body.entity_ref, req.body.status, res.locals.ctx);
        res.json("OK")
        logger.debug(`END processing for POST endpoint /:prefix/:version/update_status`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.patch('/:prefix/:version/update_status', check_request({
        allowed_query_params: [],
        allowed_body_params: ['context', 'entity_ref', 'status']
    }), trace("update_status"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for PATCH endpoint /:prefix/:version/update_status`, { tags: [PapieaEngineTags.Provider] })
        await providerApi.update_status(req.user, req.params.prefix, req.params.version, req.body.entity_ref, req.body.status, res.locals.ctx);
        res.json("OK")
        logger.debug(`END processing for PATCH endpoint /:prefix/:version/update_status`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.post('/:prefix/:version/update_progress', check_request({
        allowed_query_params: [],
        allowed_body_params: ['context', 'message', 'done_percent']
    }), trace("update_progress"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for POST endpoint /:prefix/:version/update_progress`, { tags: [PapieaEngineTags.Provider] })
        await providerApi.update_progress(req.user, req.params.prefix, req.params.version, req.body.message, req.body.done_percent, res.locals.ctx);
        res.json("OK");
        logger.debug(`END processing for POST endpoint /:prefix/:version/update_progress`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.post('/:prefix/:version/power', check_request({
        allowed_query_params: [],
        allowed_body_params: ['power']
    }), trace("power"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for POST endpoint /:prefix/:version/power`, { tags: [PapieaEngineTags.Provider] })
        const power: Provider_Power = Provider_Power[req.body.power as keyof typeof Provider_Power];
        await providerApi.power(req.user, req.params.prefix, req.params.version, power, res.locals.ctx);
        res.json("OK")
        logger.debug(`END processing for POST endpoint /:prefix/:version/power`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.post('/:prefix/:version/auth', CheckNoQueryParams, trace("update_auth"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for POST endpoint /:prefix/:version/auth`, { tags: [PapieaEngineTags.Provider] })
        await providerApi.update_auth(req.user, req.params.prefix, req.params.version, req.body, res.locals.ctx);
        res.json("OK");
        logger.debug(`END processing for POST endpoint /:prefix/:version/auth`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.get('/:prefix/:version/s2skey', check_request({
        allowed_query_params: ['deleted']
    }), trace("filter_keys"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for GET endpoint /:prefix/:version/s2skey`, { tags: [PapieaEngineTags.Provider] })
        const s2skeys = await providerApi.filter_keys(req.user, {
            "provider_prefix": req.params.prefix,
            "deleted_at": req.query.deleted
        }, res.locals.ctx);
        res.json(s2skeys);
        logger.debug(`END processing for GET endpoint /:prefix/:version/s2skey`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.post('/:prefix/:version/s2skey', check_request({
        allowed_query_params: [],
        allowed_body_params: ['user_info', 'name', 'owner', 'key']
    }), trace("create_key"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for POST endpoint /:prefix/:version/s2skey`, { tags: [PapieaEngineTags.Provider] })
        if (req.body.user_info && req.body.user_info.provider_prefix) {
            throw new BadRequestError(`provider_prefix should not be specified in the user info to create s2skey for provider ${req.params.prefix}/${req.params.version}`, { provider_prefix: req.params.prefix, provider_version: req.params.version });
        }
        const s2skey = await providerApi.create_key(req.user, req.body.name, req.body.owner, req.params.prefix,
            res.locals.ctx, req.body.user_info, req.body.key);
        res.json(s2skey);
        logger.debug(`END processing for POST endpoint /:prefix/:version/s2skey`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.put('/:prefix/:version/s2skey', check_request({
        allowed_query_params: [],
        allowed_body_params: ['active', 'uuid']
    }), trace("inactive_key"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for PUT endpoint /:prefix/:version/s2skey`, { tags: [PapieaEngineTags.Provider] })
        if (!req.body.active) {
            await providerApi.inactivate_key(req.user, req.body.uuid, res.locals.ctx);
        }
        res.json("OK");
        logger.debug(`END processing for PUT endpoint /:prefix/:version/s2skey`, { tags: [PapieaEngineTags.Provider] })
    }));

    providerApiRouter.post('/:prefix/:version/s2skey/filter', check_request({
        allowed_query_params: [],
        allowed_body_params: ['user_info', 'name', 'owner', 'key']
    }), trace("filter_keys"), asyncHandler(async (req, res) => {
        logger.debug(`BEGIN processing for POST endpoint /:prefix/:version/s2skey/filter`, { tags: [PapieaEngineTags.Provider] })
        const filter: any = {};
        for (let property of Object.keys(req.body)) {
            filter[property] = req.body[property];
        }
        const result = await providerApi.filter_keys(req.user, filter, res.locals.ctx);
        res.json({ results: result, entity_count: result.length })
        logger.debug(`END processing for POST endpoint /:prefix/:version/s2skey/filter`, { tags: [PapieaEngineTags.Provider] })
    }));

    return providerApiRouter;
}
