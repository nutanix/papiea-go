#!/bin/sh
set -e
mkdir -p certs &&
cd certs &&
openssl genrsa -out ca.key 4096 &&
openssl req -x509 -new -nodes -key ca.key -days 365 -out ca.crt -subj "/C=US/ST=California/L=SanJose/O=Nutanix/OU=CA/CN=papiea" &&
openssl genrsa -out server.key 4096 &&
openssl req -new -key server.key -out server.csr -subj "/C=US/ST=California/L=SanJose/O=Nutanix/OU=Papiea/CN=localhost" &&
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365 &&
cd ../../papiea-client &&
mkdir -p certs &&
cd certs &&
cp ../../papiea-engine/certs/ca.crt ./ &&
cd ../../papiea-sdk/python/e2e_tests &&
cp -r ../../../papiea-client/certs ./ &&
cd ../../typescript &&
cp -r ../python/e2e_tests/certs ./