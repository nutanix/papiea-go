import { Provider_DB } from "../databases/provider_db_interface";
import { Provider, Kind, Procedural_Signature } from "papiea-core";

export default class ApiDocsGenerator {
    providerDb: Provider_DB;

    constructor(providerDb: Provider_DB) {
        this.providerDb = providerDb;
    }

    getDefaultResponse() {
        return {
            "description": "Unexpected error",
            "content": {
                "application/json": {
                    "schema": {
                        "$ref": "#/components/schemas/Error"
                    }
                }
            }
        };
    }

    getResponseMany(kind: Kind) {
        return {
            "200": {
                "description": `${ kind.name } response`,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "required": ["metadata", "spec"],
                                "properties": {
                                    "metadata": {
                                        "$ref": `#/components/schemas/Metadata`
                                    },
                                    "spec": {
                                        "$ref": `#/components/schemas/${ kind.name }`
                                    },
                                    "status": {
                                        "type": "object"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "default": this.getDefaultResponse()
        };
    }

    getResponseSingle(kind: Kind) {
        return {
            "200": {
                "description": `${ kind.name } response`,
                "content": {
                    "application/json": {
                        "schema": {
                            "required": ["metadata", "spec"],
                            "properties": {
                                "metadata": {
                                    "$ref": `#/components/schemas/Metadata`
                                },
                                "spec": {
                                    "$ref": `#/components/schemas/${ kind.name }`
                                },
                                "status": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            },
            "default": this.getDefaultResponse()
        }
    }

    getKind(provider: Provider, kind: Kind) {
        return {
            "description": `Returns all entities' specs of kind ${ kind.name }`,
            "operationId": `find${ provider.prefix }${ kind.name }`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }`],
            "parameters": [
                {
                    "name": "offset",
                    "in": "query",
                    "description": "offset of results to return",
                    "required": false,
                    "schema": {
                        "type": "integer",
                        "format": "int32"
                    }
                },
                {
                    "name": "limit",
                    "in": "query",
                    "description": "maximum number of results to return",
                    "required": false,
                    "schema": {
                        "type": "integer",
                        "format": "int32"
                    }
                },
                {
                    "name": "spec",
                    "in": "query",
                    "description": "jsonified spec filter",
                    "required": false,
                    "schema": {
                        "type": "string"
                    }
                }
            ],
            "responses": this.getResponseMany(kind)
        };
    }

    postKindFilter(provider: Provider, kind: Kind) {
        return {
            "description": `Returns all entities' specs of kind ${ kind.name }`,
            "operationId": `find${ provider.prefix }${ kind.name }Filter`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }`],
            "requestBody": {
                "description": `${ kind.name } to add`,
                "required": false,
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "spec": {
                                    "$ref": `#/components/schemas/${ kind.name }`
                                }
                            }
                        }
                    }
                }
            },
            "responses": this.getResponseMany(kind)
        };
    }

    postKind(provider: Provider, kind: Kind) {
        return {
            "description": `Creates a new ${ kind.name }`,
            "operationId": `add${ provider.prefix }${ kind.name }`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }`],
            "requestBody": {
                "description": `${ kind.name } to add`,
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "spec": {
                                    "$ref": `#/components/schemas/${ kind.name }`
                                },
                                "metadata": {
                                    "$ref": `#/components/schemas/Metadata`
                                }
                            }
                        }
                    }
                }
            },
            "responses": this.getResponseSingle(kind)
        };
    }

    getKindEntity(provider: Provider, kind: Kind) {
        return {
            "description": `Returns an entity of kind ${ kind.name } by uuid`,
            "operationId": `find${ provider.prefix }${ kind.name }ByUuid`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }`],
            "parameters": [
                {
                    "name": "uuid",
                    "in": "path",
                    "description": "UUID of the entity",
                    "required": true,
                    "schema": {
                        "type": "string",
                        "format": "uuid"
                    }
                }
            ],
            "responses": this.getResponseSingle(kind)
        };
    }

    deleteKindEntity(provider: Provider, kind: Kind) {
        return {
            "description": `Deletes an entity of kind ${ kind.name } by uuid`,
            "operationId": `delete${ provider.prefix }${ kind.name }`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }`],
            "parameters": [
                {
                    "name": "uuid",
                    "in": "path",
                    "description": "UUID of the entity",
                    "required": true,
                    "schema": {
                        "type": "string",
                        "format": "uuid"
                    }
                }
            ],
            "responses": {
                "204": {
                    "description": `${ kind.name } deleted`
                },
                "default": this.getDefaultResponse()
            }
        };
    }

    putKindEntity(provider: Provider, kind: Kind) {
        return {
            "description": `Replaces an entity of kind ${ kind.name } by uuid`,
            "operationId": `replace${ provider.prefix }${ kind.name }`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }`],
            "parameters": [
                {
                    "name": "uuid",
                    "in": "path",
                    "description": "UUID of the entity",
                    "required": true,
                    "schema": {
                        "type": "string",
                        "format": "uuid"
                    }
                },
            ],
            "requestBody": {
                "description": `${ kind.name } to replace with`,
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "spec": {
                                    "$ref": `#/components/schemas/${ kind.name }`
                                },
                                "metadata": {
                                    "properties": {
                                        "spec_version": {
                                            "type": "integer"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "responses": this.getResponseSingle(kind)
        };
    }

    patchKindEntity(provider: Provider, kind: Kind) {
        return {
            "description": `Updates an entity of kind ${ kind.name } by uuid`,
            "operationId": `update${ provider.prefix }${ kind.name }`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }`],
            "parameters": [
                {
                    "name": "uuid",
                    "in": "path",
                    "description": "UUID of the entity",
                    "required": true,
                    "schema": {
                        "type": "string",
                        "format": "uuid"
                    }
                }
            ],
            "requestBody": {
                "description": `Patch to update with`,
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": `#/components/schemas/PatchRequest`
                        }
                    }
                }
            },
            "responses": this.getResponseSingle(kind)
        };
    }

    processEmptyValidation(proc_def: any, sig: Procedural_Signature) {
        if (!sig.argument) {
            proc_def.requestBody.content["application/json"].schema.properties.input.$ref = `#/components/schemas/Nothing`
        }
        if (!sig.result) {
            proc_def.responses["200"].content["application/json"].schema.properties.input.$ref = `#/components/schemas/Nothing`
        }
        return proc_def
    }

    callKindProcedure(provider: Provider, kind: Kind, procedure: Procedural_Signature) {
        const procedural_def = {
            "description": `Calls a procedure ${ procedure.name }`,
            "operationId": `call${ provider.prefix }${ procedure.name }`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }/procedure`],
            "requestBody": {
                "description": `${ procedure.name } input`,
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "input": {
                                    "$ref": `#/components/schemas/${ Object.keys(procedure.argument)[0] }`
                                }
                            }
                        }
                    }
                }
            },
            "responses": {
                "200": {
                    "description": `${ procedure.name } response`,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": `#/components/schemas/${ Object.keys(procedure.result)[0] }`
                            }
                        }
                    }
                },
                "default": this.getDefaultResponse()
            }
        };
        return this.processEmptyValidation(procedural_def, procedure)
    }

    callEntityProcedure(provider: Provider, kind: Kind, procedure: Procedural_Signature) {
        const procedural_def = {
            "description": `Calls a procedure ${ procedure.name }`,
            "operationId": `call${ provider.prefix }${ procedure.name }`,
            "tags": [`${ provider.prefix }/${ provider.version }/${ kind.name }/procedure`],
            "parameters": [
                {
                    "name": "uuid",
                    "in": "path",
                    "description": "UUID of the entity",
                    "required": true,
                    "schema": {
                        "type": "string",
                        "format": "uuid"
                    }
                },
            ],
            "requestBody": {
                "description": `${ procedure.name } input`,
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "input": {
                                    "$ref": `#/components/schemas/${ Object.keys(procedure.argument)[0] }`
                                }
                            }
                        }
                    }
                }
            },
            "responses": {
                "200": {
                    "description": `${ procedure.name } response`,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": `#/components/schemas/${ Object.keys(procedure.result)[0] }`
                            }
                        }
                    }
                },
                "default": this.getDefaultResponse()
            }
        };
        return this.processEmptyValidation(procedural_def, procedure)
    }

    callProviderProcedure(provider: Provider, procedure: Procedural_Signature) {
        const procedural_def = {
            "description": `Calls a procedure ${ procedure.name }`,
            "operationId": `call${ provider.prefix }${ procedure.name }`,
            "tags": [`${ provider.prefix }/${ provider.version }/procedure`],
            "requestBody": {
                "description": `${ procedure.name } input`,
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "input": {
                                    // Shlomi.v TODO: Input and output shapes should be optional. A procedure may have the sig void->void
                                    "$ref": `#/components/schemas/${ Object.keys(procedure.argument)[0] }`
                                }
                            }
                        }
                    }
                }
            },
            "responses": {
                "200": {
                    "description": `${ procedure.name } response`,
                    "content": {
                        "application/json": {
                            "schema": {
                                // Shlomi.v TODO: Input and output shapes should be optional. A procedure may have the sig void->void
                                "$ref": `#/components/schemas/${ Object.keys(procedure.result)[0] }`
                            }
                        }
                    }
                },
                "default": this.getDefaultResponse()
            }
        };
        return this.processEmptyValidation(procedural_def, procedure)
    }

    removeStatusFields(schema: any) {
        for (let prop in schema) {
            if (typeof schema[prop] === 'object' && "x-papiea" in schema[prop] && schema[prop]["x-papiea"] === "status-only") {
                delete schema[prop];
            }
            else if (typeof schema[prop] === 'object')
                this.removeStatusFields(schema[prop]);
        }
    }

    async getApiDocs(): Promise<any> {
        const root: any = {
            "openapi": "3.0.0",
            "info": {
                "version": "1.0.0",
                "title": "Swagger Papiea",
                "description": "An API specification of Papiea-JS",
                "license": {
                    "name": "LICENSE",
                    "url": "https://github.com/nutanix/papiea-js/blob/master/LICENSE"
                }
            },
            "servers": [
                {
                    "url": "/"
                }
            ],
            "paths": {},
            "components": {
                "schemas": {
                    "Error": {
                        "required": [
                            "code",
                            "message"
                        ],
                        "properties": {
                            "code": {
                                "type": "integer",
                                "format": "int32"
                            },
                            "message": {
                                "type": "string"
                            }
                        }
                    },
                    "Metadata": {
                        "required": [
                            "uuid",
                            "kind",
                            "spec_version"
                        ],
                        "properties": {
                            "uuid": {
                                "type": "string",
                                "format": "uuid"
                            },
                            "kind": {
                                "type": "string"
                            },
                            "spec_version": {
                                "type": "integer",
                                "format": "int32"
                            },
                            "created_at": {
                                "type": "string",
                                "format": "date-time"
                            },
                            "deleted_at": {
                                "type": "string",
                                "format": "date-time"
                            }
                        }
                    },
                    "Nothing": {
                        "type": "object",
                        "description": "Representation of a 'void' type"
                    }
                    /*"PatchRequest": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/PatchDocument"
                        }
                    },
                    "PatchDocument": {
                        "description": "A JSONPatch document as defined by RFC 6902",
                        "required": [
                            "op",
                            "path"
                        ],
                        "properties": {
                            "op": {
                                "type": "string",
                                "description": "The operation to be performed",
                                "enum": [
                                    "add",
                                    "remove",
                                    "replace",
                                    "move",
                                    "copy",
                                    "test"
                                ]
                            },
                            "path": {
                                "type": "string",
                                "description": "A JSON-Pointer"
                            },
                            "value": {
                                "type": "object",
                                "description": "The value to be used within the operations."
                            },
                            "from": {
                                "type": "string",
                                "description": "A string containing a JSON Pointer value."
                            }
                        }
                    }*/
                }
            }
        };

        const paths = root.paths;
        const schemas = root.components.schemas;
        const providers = await this.providerDb.list_providers();
        providers.forEach(provider => {
            provider.kinds.forEach(kind => {
                paths[`/services/${ provider.prefix }/${ provider.version }/${ kind.name }`] = {
                    "get": this.getKind(provider, kind),
                    "post": this.postKind(provider, kind)
                };
                paths[`/services/${ provider.prefix }/${ provider.version }/${ kind.name }/filter`] = {
                    "post": this.postKindFilter(provider, kind)
                };
                paths[`/services/${ provider.prefix }/${ provider.version }/${ kind.name }/{uuid}`] = {
                    "get": this.getKindEntity(provider, kind),
                    "delete": this.deleteKindEntity(provider, kind),
                    "put": this.putKindEntity(provider, kind)
                };
                if (kind.kind_procedures) {
                    Object.values(kind.kind_procedures).forEach(procedure => {
                        paths[`/services/${ provider.prefix }/${ provider.version }/${ kind.name }/procedure/${ procedure.name }`] = {
                            "post": this.callKindProcedure(provider, kind, procedure)
                        };
                        Object.assign(schemas, procedure.argument);
                        Object.assign(schemas, procedure.result);
                    });
                }
                if (kind.entity_procedures) {
                    Object.values(kind.entity_procedures).forEach(procedure => {
                        paths[`/services/${ provider.prefix }/${ provider.version }/${ kind.name }/{uuid}/procedure/${ procedure.name }`] = {
                            "post": this.callEntityProcedure(provider, kind, procedure)
                        };
                        Object.assign(schemas, procedure.argument);
                        Object.assign(schemas, procedure.result);
                    });
                }
                if (provider.procedures) {
                    Object.values(provider.procedures).forEach(procedure => {
                        paths[`/services/${ provider.prefix }/${ provider.version }/procedure/${ procedure.name }`] = {
                            "post": this.callProviderProcedure(provider, procedure)
                        };
                        Object.assign(schemas, procedure.argument);
                        Object.assign(schemas, procedure.result);
                    });
                }
                this.removeStatusFields(kind.kind_structure[Object.keys(kind.kind_structure)[0]]);
                Object.assign(schemas, kind.kind_structure);
            });
        });

        return root;
    }
}
