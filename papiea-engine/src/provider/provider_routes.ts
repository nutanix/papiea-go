import * as express from "express";
import { Provider_API, Provider_Power } from "./provider_api_interface";
import { asyncHandler } from '../auth/authn';
import { BadRequestError } from '../errors/bad_request_error';
import { CheckNoQueryParams, check_request } from "../validator/express_validator";

export default function createProviderAPIRouter(providerApi: Provider_API) {
    const providerApiRouter = express.Router();

    providerApiRouter.post('/', CheckNoQueryParams, asyncHandler(async (req, res) => {
        const result = await providerApi.register_provider(req.user, req.body);
        res.json(result);
    }));

    providerApiRouter.get('/', CheckNoQueryParams, asyncHandler(async (req, res) => {
        const result = await providerApi.list_providers(req.user);
        res.json(result);
    }))

    providerApiRouter.get('/:prefix/:version', CheckNoQueryParams, asyncHandler(async (req, res) => {
        const provider = await providerApi.get_provider(req.user, req.params.prefix, req.params.version);
        res.json(provider)
    }));

    providerApiRouter.delete('/:prefix/:version', CheckNoQueryParams, asyncHandler(async (req, res) => {
        await providerApi.unregister_provider(req.user, req.params.prefix, req.params.version);
        res.json("OK")
    }));

    providerApiRouter.get('/:prefix', CheckNoQueryParams, asyncHandler(async (req, res) => {
        const provider = await providerApi.list_providers_by_prefix(req.user, req.params.prefix);
        res.json(provider)
    }));

    providerApiRouter.post('/update_status', check_request({
        allowed_query_params: [],
        allowed_body_params: ['context', 'entity_ref', 'status']
    }), asyncHandler(async (req, res) => {
        await providerApi.replace_status(req.user, req.body.context, req.body.entity_ref, req.body.status);
        res.json("OK")
    }));

    providerApiRouter.patch('/update_status', check_request({
        allowed_query_params: [],
        allowed_body_params: ['context', 'entity_ref', 'status']
    }), asyncHandler(async (req, res) => {
        await providerApi.update_status(req.user, req.body.context, req.body.entity_ref, req.body.status);
        res.json("OK")
    }));

    providerApiRouter.post('/update_progress', check_request({
        allowed_query_params: [],
        allowed_body_params: ['context', 'message', 'done_percent']
    }), asyncHandler(async (req, res) => {
        await providerApi.update_progress(req.user, req.body.context, req.body.message, req.body.done_percent);
        res.json("OK");
    }));

    providerApiRouter.post('/:prefix/:version/power', check_request({
        allowed_query_params: [],
        allowed_body_params: ['power']
    }), asyncHandler(async (req, res) => {
        const power: Provider_Power = Provider_Power[req.body.power as keyof typeof Provider_Power];
        await providerApi.power(req.user, req.params.prefix, req.params.version, power);
        res.json("OK")
    }));

    providerApiRouter.post('/:prefix/:version/auth', CheckNoQueryParams, asyncHandler(async (req, res) => {
        await providerApi.update_auth(req.user, req.params.prefix, req.params.version, req.body);
        res.json("OK");
    }));

    providerApiRouter.get('/:prefix/:version/s2skey', check_request({
        allowed_query_params: ['deleted']
    }), asyncHandler(async (req, res) => {
        const s2skeys = await providerApi.filter_keys(req.user, {
            "provider_prefix": req.params.prefix,
            "deleted_at": req.query.deleted
        });
        res.json(s2skeys);
    }));

    providerApiRouter.post('/:prefix/:version/s2skey', check_request({
        allowed_query_params: [],
        allowed_body_params: ['user_info', 'name', 'owner', 'key']
    }), asyncHandler(async (req, res) => {
        if (req.body.user_info && req.body.user_info.provider_prefix) {
            throw new BadRequestError('provider_prefix may not be specified in the request body');
        }
        const s2skey = await providerApi.create_key(req.user, req.body.name, req.body.owner, req.params.prefix,
            req.body.user_info, req.body.key);
        res.json(s2skey);
    }));

    providerApiRouter.put('/:prefix/:version/s2skey', check_request({
        allowed_query_params: [],
        allowed_body_params: ['active', 'uuid']
    }), asyncHandler(async (req, res) => {
        if (!req.body.active) {
            await providerApi.inactivate_key(req.user, req.body.uuid);
        }
        res.json("OK");
    }));

    providerApiRouter.post('/:prefix/:version/s2skey/filter', check_request({
        allowed_query_params: [],
        allowed_body_params: ['user_info', 'name', 'owner', 'key']
    }), asyncHandler(async (req, res) => {
        const filter: any = {};
        for (let property of Object.keys(req.body)) {
            filter[property] = req.body[property];
        }
        const result = await providerApi.filter_keys(req.user, filter);
        res.json({ results: result, entity_count: result.length })
    }));

    return providerApiRouter;
}
