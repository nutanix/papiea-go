import { register_provider } from "./provider";
import { location_provider_config, papiea_config, server_config } from "./config";
import { ProviderSdk } from "../../../../src/provider_sdk/typescript_sdk";


async function main() {

    //Instantiate SDK
    const sdk = ProviderSdk.create_provider(papiea_config.host, papiea_config.port, server_config.host, server_config.port);

    //Register provider with SDK
    await register_provider(sdk, location_provider_config);
}

main().then().catch(err => {
    console.error(err)
});