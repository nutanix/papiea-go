FROM nutanix-docker.jfrog.io/papiea:base

COPY . /code
WORKDIR /code/papiea-engine
RUN cd /code \
    # Use cached node_modules
    && mv /node_modules /code/papiea-engine/node_modules \
    && npm run install-all \
    && npm --prefix papiea-engine run build-clj \
    && npm run build-all 

CMD npm run start
