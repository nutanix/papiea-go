import { Status_DB } from "./databases/status_db_interface";
import { Spec_DB } from "./databases/spec_db_interface";
import { Provider_DB } from "./databases/provider_db_interface";

// [[file:~/work/papiea-js/Papiea-design.org::*/src/papiea.ts][/src/papiea.ts:1]]


// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-680][papiea-interface]]
export interface Papiea {

    // api is the mechanism which adds REST endpoints to Papiea.
    api: any; // For now, this will be the type of the API router
    prefix: string;

    statusDb: Status_DB;
    specsDb: Spec_DB;
    providersDb: Provider_DB;
}
