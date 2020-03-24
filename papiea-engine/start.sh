#!/bin/sh

if [ -d "/node_modules" ] && [ ! -d "node_modules" ]; then
    echo "Use cached node_modules from root"
    mv /node_modules node_modules
fi

DB_HOST=${MONGO_HOST:-'mongo'}
DB_PORT=${MONGO_PORT:-'27017'}
npm install
npm run build-clj
wait-port $DB_HOST:$DB_PORT
if [ $HOT_RELOAD == 'true' ]
then
    if [ $PAPIEA_DEBUG == 'true' ]; then
        npm run debug &
        npm run debug_differ
    else
        npm run dev &
        npm run start_differ
    fi
else
    npm run start_differ &
    npm run start
fi
