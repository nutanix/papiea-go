mkdir certs \
&& cd certs \
&& openssl genrsa -out ca.key 4096 \
&& openssl req -new -x509 -sha256 -key ca.key -out ca.crt -subj "/C=US/ST=California/L=SanJose/O=Nutanix/OU=Clusters/CN=localhost" \
&& openssl genrsa -out server.key 4096 \
&& openssl req -new -key server.key -out server.csr -subj "/C=US/ST=California/L=SanJose/O=Nutanix/OU=Clusters/CN=localhost" \
&& openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt  -days 1 -sha256