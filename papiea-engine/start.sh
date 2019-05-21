#!/bin/sh

if [ -d "/node_modules" ] && [ ! -d "node_modules" ]; then
    echo "Use cached node_modules"
    mv /node_modules node_modules
fi

DB_HOST=${$MONGO_HOST:-'mongo'}
DB_PORT=${$MONGO_PORT:-'27017'}
npm install
npm run build-clj
wait-port $DB_HOST:$DB_PORT
if [ $HOT_RELOAD == 'true' ]
then
    npm run dev
else
    npm run start
fi
