#!/usr/bin/env python
import subprocess
import os


subprocess.check_call([
    'docker', 'login',
    'nutanix-docker.jfrog.io',
    '-u', os.environ['ARTIFACTORY_USER'],
    '-p', os.environ['ARTIFACTORY_PASSWORD']])