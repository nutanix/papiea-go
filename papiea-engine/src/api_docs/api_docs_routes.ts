import { Request, Response, NextFunction, Router } from "express";
import * as swaggerUi from "swagger-ui-express";
import ApiDocsGenerator from "./api_docs_provider_generator";
import { Provider_DB } from "../databases/provider_db_interface";
import * as admin_swagger from './admin_swagger.json';
import { Provider } from "papiea-core";

async function swaggerSetupWrapper(req: Request, apiDocsGenerator: ApiDocsGenerator, providerDb: Provider_DB) {
    const provider: Provider = await providerDb.get_provider(req.params.provider, req.params.version);
    const apiDocJson: any = await apiDocsGenerator.getApiDocs(provider);
    return swaggerUi.setup(apiDocJson);
}

export default function createAPIDocsRouter(urlPrefix: string, apiDocsGenerator: ApiDocsGenerator, providerDb: Provider_DB) {
    const apiDocsRouter = Router();

    apiDocsRouter.use('/', swaggerUi.serve);
    apiDocsRouter.get('/:provider/:version', async (req: Request, res: Response, next: NextFunction) => {
        const swaggerSetup = await swaggerSetupWrapper(req, apiDocsGenerator, providerDb);
        return swaggerSetup(req, res, next);
    });

    apiDocsRouter.get('/admin', swaggerUi.setup((<any>admin_swagger)));

    apiDocsRouter.get('*/swagger-ui-init.js', async (req: Request, res: Response, next: NextFunction) => {
        await res.redirect(`${urlPrefix}/swagger-ui-init.js`);
    });
    
    apiDocsRouter.get('*/swagger-ui-bundle.js', async (req: Request, res: Response, next: NextFunction) => {
        await res.redirect(`${urlPrefix}/swagger-ui-bundle.js`);
    });
    
    apiDocsRouter.get('*/swagger-ui-standalone-preset.js', async (req: Request, res: Response, next: NextFunction) => {
        await res.redirect(`${urlPrefix}/swagger-ui-standalone-preset.js`);
    });
    
    apiDocsRouter.get('*/swagger-ui.css', async (req: Request, res: Response, next: NextFunction) => {
        await res.redirect(`${urlPrefix}/swagger-ui.css`);
    });


    return apiDocsRouter;
}