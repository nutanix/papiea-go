# papiea-js

<img src="https://upload.wikimedia.org/wikipedia/commons/1/13/Papaya.svg" width="150" height="150">

Papiea, pronounced like the fruit, is an Intent engine based on perscriptions or recipes for handling differences
between intended state and real world state.

## Design document

Please see [Papiea's design document](https://nutanix.github.io/papiea-js/Papiea-design.html)

## Build Instructions Papiea

Since papiea consists of multiple package you need to build them all
separately or use a set of commands to build them all

1. In the project root install all dependencies `npm run install-all`.

2. In the project root build all packages `npm run build-all`.

## Local Development Instructions Papiea-Engine

Papiea-Engine is the main component that serves web requests and integrates intentful engine
with entity information stores in a database. Make sure that you have Docker and Docker-compose since they are required to run Papiea-Engine

1. In the project root cd into papiea engine package `cd papiea-engine`

2. To start a container `docker-compose up -d`

Papiea-Engine will now be running on port `3000` inside the container and will use port `3333` externally

To stop a container

1. `docker-compose stop`

## Debug configuration Papiea-Engine

Instead of using usual `docker-compose up` in papiea-engine dir, use `docker-compose -f docker-compose-debug.yml up` to enable hot-reload and debugger listening on port `9229`
See [Attaching to node js using VS Code](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_attaching-to-nodejs)
See [Attaching to node js using Intellij](https://www.jetbrains.com/help/pycharm/running-and-debugging-node-js.html#a34dc5da)

## Environment Papiea-Engine

A set of these variables might be used to tweak the default papiea-engine configuration

* `MONGO_HOST` - mongo host (default `mongo`)
* `MONGO_PORT` - mongo port (default `27017`)
* `PAPIEA_PUBLIC_URL` - external papiea address (default `"http://localhost:3000"`)
* `HOT_RELOAD` - use nodemon to autoreload papiea on code changes (default `false`)
* `DEBUG_LEVEL` - log level for [morgan](https://github.com/expressjs/morgan) logging (default `common`)
* `PAPIEA_ADMIN_S2S_KEY` - papiea admin's s2s key

## CLJS instructions

For now this clojurescript library is embedded, but it may end up in a different repository and will be exposed as a regular npm package which will be imported through npm. Until this happens, here are the instructions for developing this library:

1. Make sure `leiningen` is installed (follow [leiningen installation]<https://github.com/technomancy/leiningen#installation)>
2. To use live repl with clojurescript do the following:

    ```bash
    cd papiea-lib-clj
    lein repl
    ```

    and inside the repl type:

    ```clojure
    (require 'cljs.repl.nashorn)
    (cider.piggieback/cljs-repl (cljs.repl.nashorn/repl-env))
    ```

    Then go to emacs with cider installed
    ([Cider Installation]<https://github.com/clojure-emacs/cider#installation),> do `M+x cider-connect-cljs`,
    select the host where the repl is running (usually localhost, but can be run anywhere.
    Use `.ssh/config` to name that host), then select `node` as the running environment and you should have a repl.
    Debugging is not yet working in cljs, but I simply use regular clojure if I need to live debug for now.

## License and copyright

Copyright (C) 2018 Nutanix

The code in the public repositories is licensed under the Apache
license.

Licensed under the Apache License, Version 2.0 (the "License"); you
may not use this file except in compliance with the License.  You may
obtain a copy of the License at

[Apache License]<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.  See the License for the specific language governing
permissions and limitations under the License.