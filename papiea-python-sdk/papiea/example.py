import asyncio
import json
import logging
import os

from aiohttp import ClientSession
from yaml import Loader as YamlLoader
from yaml import load as load_yaml

from core import Entity, Key, ProceduralExecutionStrategy, S2S_Key
from python_sdk import ProviderSdk

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s.%(msecs)03d %(levelname)s %(module)s - %(funcName)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


PAPIEA_URL = os.getenv("PAPIEA_URL", "http://127.0.0.1:3333")
PAPIEA_ADMIN_S2S_KEY = os.getenv("PAPIEA_ADMIN_S2S_KEY", "")
PROVIDER_HOST = os.getenv("PROVIDER_HOST", "example-provider")
PROVIDER_PORT = 9000
PROVIDER_VERSION = "0.1.0"
PROVIDER_ADMIN_S2S_KEY = "Sa8xaic9"


def wait_port_is_open(url):
    import socket
    import time
    from urllib.parse import urlparse

    urlparts = urlparse(url).netloc.split(":")
    host = urlparts[0]
    port = int(urlparts[1])
    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex((host, port))
            sock.close()
            if result == 0:
                return
        except socket.gaierror:
            pass
        time.sleep(1)


def load_yaml_from_file(filename):
    with open(filename) as f:
        return load_yaml(f, Loader=YamlLoader)


async def create_provider_admin_s2s_key(sdk: ProviderSdk, new_key: Key):
    admin_security_api = sdk.provider_security_api

    the_key = S2S_Key(
        name="location provider admin s2s key",
        owner="admin.xiclusters@nutanix.com",
        key=new_key,
        user_info={"is_provider_admin": True},
    )

    keys = await admin_security_api.list_keys()
    for key in keys:
        if key.name == the_key.name:
            logger.debug(f"Key {the_key.name} already exists")
            return

    new_s2s_key = await admin_security_api.create_key(the_key)
    provider_admin_security_api = sdk.new_security_api(new_key)
    user_info = await provider_admin_security_api.user_info()
    logger.debug(f"User info {user_info}")


async def create_user_s2s_key(sdk: ProviderSdk):
    admin_security_api = sdk.provider_security_api

    the_key = S2S_Key(
        name="location provider some.user s2s key",
        user_info={"owner": "alice", "tenant": "ada14b27-c147-4aca-9b9f-7762f1f48426"},
    )

    new_s2s_key = await admin_security_api.create_key(the_key)
    user_security_api = sdk.new_security_api(new_s2s_key.key)
    user_info = await user_security_api.user_info()
    logger.debug(f"User info {user_info}")
    return new_s2s_key.key


async def move_x(ctx, entity, input):
    entity.spec.x += input
    entity_update = Entity(metadata=entity.metadata, spec=entity.spec)
    async with ctx.user_api_for_entity(entity) as entity_api:
        await entity_api.put("", entity_update)
    return entity_update.spec.x


async def main():
    location_kind_definition = load_yaml_from_file(
        "./test_data/location_kind_test_data.yml"
    )
    metadata_extension = load_yaml_from_file("./test_data/metadata_extension.yml")
    procedure_move_input_definition = load_yaml_from_file(
        "./test_data/procedure_move_input.yml"
    )
    procedure_move_output_definition = load_yaml_from_file(
        "./test_data/procedure_move_output.yml"
    )
    oauth_config = load_yaml_from_file("./test_data/auth.yaml")
    with open("./test_data/provider_model_example.txt") as f:
        casbin_model = f.read()
    with open("./test_data/provider_policy_example.txt") as f:
        casbin_initial_policy = f.read()
    async with ProviderSdk.create_provider(
        PAPIEA_URL, PAPIEA_ADMIN_S2S_KEY, PROVIDER_HOST, PROVIDER_PORT
    ) as sdk:
        sdk.version(PROVIDER_VERSION)
        sdk.prefix("location_provider")
        sdk.secure_with(
            oauth_config=oauth_config,
            casbin_model=casbin_model,
            casbin_initial_policy=casbin_initial_policy,
        )
        sdk.metadata_extension(metadata_extension)
        await create_provider_admin_s2s_key(sdk, PROVIDER_ADMIN_S2S_KEY)
        location_kind = sdk.new_kind(location_kind_definition)
        location_kind.entity_procedure(
            "moveX",
            ProceduralExecutionStrategy.HaltIntentful,
            procedure_move_input_definition,
            procedure_move_output_definition,
            move_x,
        )
        await sdk.register()
        user_s2s_key = await create_user_s2s_key(sdk)
        server = sdk.server

    async with ClientSession() as session:
        location_entity_base_url = (
            f"{PAPIEA_URL}/services/location_provider/0.1.0/Location"
        )
        data = {
            "metadata": {
                "extension": {
                    "owner": "alice",
                    "tenant_uuid": "ada14b27-c147-4aca-9b9f-7762f1f48426",
                }
            },
            "spec": {"x": 10, "y": 11},
        }
        data_binary = json.dumps(data).encode("utf-8")
        async with session.post(
            f"{location_entity_base_url}",
            data=data_binary,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {user_s2s_key}",
            },
        ) as resp:
            res = await resp.text()
            logger.debug(f"Created entity {res}")
            entity_uuid = json.loads(res)["metadata"]["uuid"]

        data = {"input": 5}
        data_binary = json.dumps(data).encode("utf-8")
        async with session.post(
            f"{location_entity_base_url}/{entity_uuid}/procedure/moveX",
            data=data_binary,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {user_s2s_key}",
            },
        ) as resp:
            res = await resp.text()
            logger.debug(f"Procedure returns {res}")

        async with session.get(
            f"{location_entity_base_url}/{entity_uuid}",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {user_s2s_key}",
            },
        ) as resp:
            res = await resp.text()
            logger.debug(f"Updated entity {res}")

    while True:
        # Serve provider procedures forever
        await asyncio.sleep(300)

    await server.close()


if __name__ == "__main__":
    wait_port_is_open(PAPIEA_URL)
    asyncio.run(main())
