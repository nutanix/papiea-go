// [[file:~/work/papiea-js/Papiea-design.org::*/src/databases/provider_db_interface.ts][/src/databases/provider_db_interface.ts:1]]
import { Version, Provider } from "papiea-core/build/core";

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-104][provider-db-interface]]

export interface Provider_DB {

    // Register a new provider with the intent engine or update existing one
    save_provider(provider: Provider): Promise<void>;

    //Upgrade a provider - This should be in the admin?
    //upgrade_provider(from_provider: uuid4, to: providerDescription): Task;

    // get a provider
    get_provider(provider_prefix: string, version: Version): Promise<Provider>

    // List all registered providers
    list_providers(): Promise<Provider[]>

    // Removes and de-registers a provider from the intent engine
    delete_provider(provider_prefix: string, version: Version): Promise<void>;

    get_latest_provider_by_kind(kind_name: string): Promise<Provider>;

    find_providers(provider_prefix: string): Promise<Provider[]>;

    get_latest_provider(provider_prefix: string): Promise<Provider>;
}

// provider-db-interface ends here
// /src/databases/provider_db_interface.ts:1 ends here
