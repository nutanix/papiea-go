import * as express from "express";
import { Provider_API, Provider_Power } from "./provider_api_interface";
import { asyncHandler } from '../auth/authn';


export default function createProviderAPIRouter(providerApi: Provider_API) {
    const providerApiRouter = express.Router();

    providerApiRouter.post('/', asyncHandler(async (req, res) => {
        const result = await providerApi.register_provider(req.user, req.body);
        res.json(result);
    }));

    providerApiRouter.get('/:prefix/:version', asyncHandler(async (req, res) => {
        const provider = await providerApi.get_provider(req.user, req.params.prefix, req.params.version);
        res.json(provider)
    }));

    providerApiRouter.delete('/:prefix/:version', asyncHandler(async (req, res) => {
        await providerApi.unregister_provider(req.user, req.params.prefix, req.params.version);
        res.json("OK")
    }));

    providerApiRouter.get('/:prefix', asyncHandler(async (req, res) => {
        const provider = await providerApi.list_providers_by_prefix(req.user, req.params.prefix);
        res.json(provider)
    }));

    providerApiRouter.post('/update_status', asyncHandler(async (req, res) => {
        await providerApi.replace_status(req.user, req.body.context, req.body.entity_ref, req.body.status);
        res.json("OK")
    }));

    providerApiRouter.patch('/update_status', asyncHandler(async (req, res) => {
        await providerApi.update_status(req.user, req.body.context, req.body.entity_ref, req.body.status);
        res.json("OK")
    }));

    providerApiRouter.post('/update_progress', asyncHandler(async (req, res) => {
        await providerApi.update_progress(req.user, req.body.context, req.body.message, req.body.done_percent);
        res.json("OK");
    }));

    providerApiRouter.post('/:prefix/:version/power', asyncHandler(async (req, res) => {
        const power: Provider_Power = Provider_Power[req.body.power as keyof typeof Provider_Power];
        await providerApi.power(req.user, req.params.prefix, req.params.version, power);
        res.json("OK")
    }));

    providerApiRouter.post('/:prefix/:version/auth', asyncHandler(async (req, res) => {
        await providerApi.update_auth(req.user, req.params.prefix, req.params.version, req.body);
        res.json("OK");
    }));

    return providerApiRouter;
}
