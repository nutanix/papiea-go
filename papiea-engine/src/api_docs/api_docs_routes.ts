import * as express from "express";
import * as swaggerUi from "swagger-ui-express";
import ApiDocsGenerator from "./api_docs_provider_generator";
import { Provider_DB } from "../databases/provider_db_interface";
import { Provider } from "papiea-core";

async function swaggerSetupWrapper(req: express.Request, apiDocsGenerator: ApiDocsGenerator, providerDb: Provider_DB) {
    const provider: Provider = await providerDb.get_provider(req.params.provider, req.params.version);
    const apiDocJson: any = await apiDocsGenerator.getApiDocs(provider);
    return swaggerUi.setup(apiDocJson);
}

export default function createAPIDocsRouter(urlPrefix: string, apiDocsGenerator: ApiDocsGenerator, providerDb: Provider_DB) {
    const apiDocsRouter = express.Router();

    apiDocsRouter.use('/', swaggerUi.serve);
    apiDocsRouter.get('/:provider/:version', async (req, res, next) => {
        const swaggerSetup = await swaggerSetupWrapper(req, apiDocsGenerator, providerDb);
        return swaggerSetup(req, res, next);
    });


    apiDocsRouter.get('*/swagger-ui-init.js', (req, res, next) => {
        res.redirect(`${urlPrefix}/swagger-ui-init.js`)
    });
    
    apiDocsRouter.get('*/swagger-ui-bundle.js', (req, res, next) => {
        res.redirect(`${urlPrefix}/swagger-ui-bundle.js`)
    });
    
    apiDocsRouter.get('*/swagger-ui-standalone-preset.js', (req, res, next) => {
        res.redirect(`${urlPrefix}/swagger-ui-standalone-preset.js`)
    });
    
    apiDocsRouter.get('*/swagger-ui.css', (req, res, next) => {
        res.redirect(`${urlPrefix}/swagger-ui.css`)
    });


    return apiDocsRouter;
}