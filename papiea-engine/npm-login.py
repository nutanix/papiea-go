#!/usr/bin/env python
import os
import sys

npm_token = os.environ.get("NPM_CONFIG_TOKEN")

if not npm_token:
    print("No NPM_TOKEN found, exiting")
    sys.exit(1)

home = os.path.expanduser("~")

# Npm will substitute the token itself
# Note: env variable name should be prefixed with NPM_CONFIG_
with open("{}/.npmrc".format(home), "w") as file:
    file.write('_auth=$TOKEN\n')
    file.write('always-auth=true\n')
