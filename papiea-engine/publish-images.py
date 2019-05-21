#!/usr/bin/env python
import subprocess
import os


tag = ('nutanix-docker.jfrog.io/papiea:' +
       os.environ['CIRCLE_BUILD_NUM'])

subprocess.check_call([
    'docker', 'login',
    'nutanix-docker.jfrog.io',
    '-u', os.environ['ARTIFACTORY_USER'],
    '-p', os.environ['ARTIFACTORY_PASSWORD']])

subprocess.check_call([
    'docker', 'build',
    '-t', tag,
    '-f', '.circleci/Dockerfile',
    '.'])

subprocess.check_call(['docker', 'push', tag])
if os.environ['CIRCLE_BRANCH'] == 'master':
    latest_tag = 'nutanix-docker.jfrog.io/papiea:latest'
    subprocess.check_call([
        'docker', 'tag', tag, latest_tag])
    subprocess.check_call(['docker', 'push', latest_tag])