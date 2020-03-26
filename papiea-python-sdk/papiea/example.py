import asyncio
import json
import os

from yaml import load as load_yaml

from python_sdk import ProviderSdk

PAPIEA_URL = os.getenv("PAPIEA_URL", "http://127.0.0.1:3333")
PAPIEA_ADMIN_S2S_KEY = os.getenv("PAPIEA_ADMIN_S2S_KEY", "")
PROVIDER_HOST = "127.0.0.1"
PROVIDER_PORT = 9000
PROVIDER_VERSION = "0.1.0"


async def main():
    with open("test_data/location_kind_test_data.yml") as f:
        location_yaml = load_yaml(f)
        print(json.dumps(location_yaml))
    async with ProviderSdk.create_provider(
        PAPIEA_URL, PAPIEA_ADMIN_S2S_KEY, PROVIDER_HOST, PROVIDER_PORT
    ) as sdk:
        sdk.new_kind(location_yaml)
        sdk.version(PROVIDER_VERSION)
        sdk.prefix("location_provider")
        await sdk.register()


if __name__ == "__main__":
    asyncio.run(main())
