import * as express from "express";
import ApiDocsGenerator from "./api_docs_generator";
const swaggerUi = require("express-swaggerize-ui");

export default function createAPIDocsRouter(urlPrefix: string, apiDocsGenerator: ApiDocsGenerator) {
    const apiDocsRouter = express.Router();

    apiDocsRouter.get('/api-docs.json', function (req, res, next) {
        apiDocsGenerator.getApiDocs().then(result => {
            res.json(result);
        }).catch(next);
    });
    apiDocsRouter.use('/', swaggerUi({ route: urlPrefix, docs: urlPrefix + '/api-docs.json' }));

    return apiDocsRouter;
}