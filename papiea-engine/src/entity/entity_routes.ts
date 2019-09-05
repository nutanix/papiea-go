import { Entity_API } from "./entity_api_interface";
import { Router } from "express";
import { UserAuthInfo, asyncHandler } from '../auth/authn';
import { processPaginationParams, processSortQuery } from "../utils/utils";
import { SortParams } from "./entity_api_impl";
import { CheckNoQueryParams, check_request } from "../validator/express_validator";

const CheckProcedureCallParams = check_request({
    allowed_query_params: [],
    allowed_body_params: ['input']
});

export function createEntityAPIRouter(entity_api: Entity_API): Router {
    const router = Router();

    const filterEntities = async function (user: UserAuthInfo, kind_name: string, filter: any, skip: number, size: number, sortParams?: SortParams): Promise<any> {
        const resultSpecs: any[] = await entity_api.filter_entity_spec(user, kind_name, filter, sortParams);

        const resultStatuses: any[] = await entity_api.filter_entity_status(user, kind_name, filter, sortParams);

        const uuidToEntity: { [key: string]: any } = {};

        resultSpecs.forEach(x => {
            uuidToEntity[x[0].uuid] = { metadata: x[0], spec: x[1] };
        });

        resultStatuses.forEach(x => {
            if (uuidToEntity[x[0].uuid] !== undefined)
                uuidToEntity[x[0].uuid].status = x[1];
        });

        const entities = Object.values(uuidToEntity);
        const totalEntities: number = entities.length;
        const pageEntities = entities.slice(skip, skip + size);

        return { results: pageEntities, entity_count: totalEntities };
    };

    router.post("/:prefix/:version/check_permission", CheckNoQueryParams, asyncHandler(async (req, res) => {
        res.json(await entity_api.check_permission(req.user, req.params.prefix, req.params.version, req.body))
    }));

    router.get("/:prefix/:version/:kind", check_request({
        allowed_query_params: ['offset', 'limit', 'sort', 'spec', 'status', 'metadata']
    }), asyncHandler(async (req, res) => {
        const filter: any = {};
        const offset: undefined | number = req.query.offset;
        const limit: undefined | number = req.query.limit;
        const rawSortQuery: undefined | string = req.query.sort;
        const sortParams = processSortQuery(rawSortQuery);
        const [skip, size] = processPaginationParams(offset, limit);
        if (req.query.spec) {
            filter.spec = JSON.parse(req.query.spec);
        } else {
            filter.spec = {};
        }
        if (req.query.status) {
            filter.status = JSON.parse(req.query.status);
        } else {
            filter.status = {};
        }
        if (req.query.metadata) {
            filter.metadata = JSON.parse(req.query.metadata);
        } else {
            filter.metadata = {};
        }
        res.json(await filterEntities(req.user, req.params.kind, filter, skip, size, sortParams));
    }));

    router.get("/:prefix/:version/:kind/:uuid", CheckNoQueryParams, asyncHandler(async (req, res) => {
        const [metadata, spec] = await entity_api.get_entity_spec(req.user, req.params.kind, req.params.uuid);
        const [_, status] = await entity_api.get_entity_status(req.user, req.params.kind, req.params.uuid);
        res.json({ "metadata": metadata, "spec": spec, "status": status });
    }));

    router.post("/:prefix/:version/:kind/filter", check_request({
        allowed_query_params: ['offset', 'limit', 'sort'],
        allowed_body_params: ['spec', 'status', 'metadata']
    }), asyncHandler(async (req, res) => {
        const offset: undefined | number = req.query.offset;
        const limit: undefined | number = req.query.limit;
        const rawSortQuery: undefined | string = req.query.sort;
        const sortParams: undefined | SortParams = processSortQuery(rawSortQuery);
        const [skip, size] = processPaginationParams(offset, limit);
        const filter: any = {};
        if (req.body.spec) {
            filter.spec = req.body.spec;
        } else {
            filter.spec = {};
        }
        if (req.body.status) {
            filter.status = req.body.status;
        } else {
            filter.status = {};
        }
        if (req.body.metadata) {
            filter.metadata = req.body.metadata;
        } else {
            filter.metadata = {};
        }

        res.json(await filterEntities(req.user, req.params.kind, filter, skip, size, sortParams));
    }));

    router.put("/:prefix/:version/:kind/:uuid", check_request({
        allowed_query_params: [],
        allowed_body_params: ['metadata', 'spec']
    }), asyncHandler(async (req, res) => {
        const request_metadata = req.body.metadata;
        const [metadata, spec] = await entity_api.update_entity_spec(req.user, req.params.uuid, req.params.prefix, request_metadata.spec_version, request_metadata.extension, req.params.kind, req.params.version, req.body.spec);
        res.json({ "metadata": metadata, "spec": spec });
    }));

    router.post("/:prefix/:version/:kind", check_request({
        allowed_query_params: [],
        allowed_body_params: ['metadata', 'spec']
    }), asyncHandler(async (req, res) => {
        if (req.params.status) {
            const [metadata, spec] = await entity_api.save_entity(req.user, req.params.prefix, req.params.kind, req.params.version, req.body.spec, req.body.metadata);
            res.json({ "metadata": metadata, "spec": spec });
        } else {
            // Spec only entity
            const [metadata, spec] = await entity_api.save_entity(req.user, req.params.prefix, req.params.kind, req.params.version, req.body.spec, req.body.metadata);
            res.json({ "metadata": metadata, "spec": spec });
        }
    }));

    router.delete("/:prefix/:version/:kind/:uuid", CheckNoQueryParams, asyncHandler(async (req, res) => {
        await entity_api.delete_entity_spec(req.user, req.params.prefix, req.params.version, req.params.kind, req.params.uuid);
        res.json("OK")
    }));

    router.post("/:prefix/:version/:kind/:uuid/procedure/:procedure_name", CheckProcedureCallParams, asyncHandler(async (req, res) => {
        const result: any = await entity_api.call_procedure(req.user, req.params.prefix, req.params.kind, req.params.version, req.params.uuid, req.params.procedure_name, req.body.input);
        res.json(result);
    }));

    router.post("/:prefix/:version/:kind/procedure/:procedure_name", CheckProcedureCallParams, asyncHandler(async (req, res) => {
        const result: any = await entity_api.call_kind_procedure(req.user, req.params.prefix, req.params.kind, req.params.version, req.params.procedure_name, req.body.input);
        res.json(result);
    }));

    router.post("/:prefix/:version/procedure/:procedure_name", CheckProcedureCallParams, asyncHandler(async (req, res) => {
        const result: any = await entity_api.call_provider_procedure(req.user, req.params.prefix, req.params.version, req.params.procedure_name, req.body.input);
        res.json(result);
    }));

    return router;
}
