import { ValidationError } from "../errors/validation_error";
import { isEmpty } from "../utils/utils"
import {
    Data_Description,
    Entity_Reference,
    FieldBehavior,
    IntentfulBehaviour,
    Kind,
    Metadata,
    Provider,
    Spec,
    Status,
    SwaggerValidatorErrorMessage
} from "papiea-core"
import { SFSCompiler } from "../intentful_core/sfs_compiler"
import * as uuid_validate from "uuid-validate"
import { load } from "js-yaml"
import { readFileSync } from "fs"
import { resolve } from "path"
import { cloneDeep } from "lodash"
import { EntityLoggingInfo } from "papiea-backend-utils";
import uuid = require("uuid");

// We can receive model in 2 forms:
// As user specified in definition, which means it has "properties" field ( { properties: {} } } )
// As procedure returned, which means it is an empty object ( {} )
function modelIsEmpty(model: any) {
    if (isEmpty(model)) {
        return true
    }
    if (model && model.properties !== undefined && model.properties !== null) {
        return isEmpty(model.properties)
    }
    return false
}

function modelIsNullable(model: any) {
    if (model && (model.required === undefined || model.required === null)) {
        return true
    }
}

function convertValidatorMessagesToPapieaMessages(
    provider_prefix: string, provider_version: string,
    kind_name: string, procedureName: string,
    errors: Error[], data: any, model: any) {
    let fieldName: string
    let message: string
    for (let i = 0;i < errors.length;i++) {
        message = errors[i].message
        if (message.includes(SwaggerValidatorErrorMessage.undefined_value_str)) {
            fieldName = message.replace(SwaggerValidatorErrorMessage.undefined_value_str, "");
            if (fieldName === 'rootModel') {
                message = `Input is null/undefined, provide input value for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}`
            } else {
                message = `Input has null/undefined value for field: ${fieldName}, provide field value for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}`
            }
        } else if (message.includes(SwaggerValidatorErrorMessage.empty_value_str)) {
            fieldName = message.replace(SwaggerValidatorErrorMessage.undefined_value_str, "");
            if (fieldName === 'rootModel') {
                message = `Input value is empty, required non-empty input value for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}`
            } else {
                message = `Input has empty value for field: ${fieldName}, required non-empty value for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}`
            }
        } else if (message.includes(SwaggerValidatorErrorMessage.undefined_model_str)) {
            message = `Schema for the input is null/undefined, required valid schema for procedure ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}`
        } else if (message.includes(SwaggerValidatorErrorMessage.type_mismatch_str)) {
            message = message.replace(SwaggerValidatorErrorMessage.type_mismatch_str, "")
            const inputType = message.slice(0, message.indexOf(','))
            const targetType = message.replace(inputType + ", expected: ", "")
            message = `Input field has type: ${inputType}, schema expected type: ${targetType} for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}\nInput:\n${JSON.stringify(data)}\nSchema:\n${JSON.stringify(model)}`
        } else if (message.includes(SwaggerValidatorErrorMessage.additional_input_field_str)) {
            message = message.replace(SwaggerValidatorErrorMessage.additional_input_field_str, "");
            fieldName = message.replace("' is not in the model", "")
            message = `Input has additional field: '${fieldName}' not present in the schema for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}\nInput:\n${JSON.stringify(data)}\nSchema:\n${JSON.stringify(model)}`
        } else if (message.includes(SwaggerValidatorErrorMessage.non_string_type_field_str)) {
            message = message.replace(SwaggerValidatorErrorMessage.non_string_type_field_str, "")
            fieldName = message.replace(") has a non string 'type' field", "")
            message = `Schema field: ${fieldName} has type set to a non-string value for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}\nSchema:\n${JSON.stringify(model)}`
        } else if (message.includes(SwaggerValidatorErrorMessage.not_object_type_str)) {
            fieldName = message.slice(0, message.indexOf(SwaggerValidatorErrorMessage.not_object_type_str))
            const fieldType = message.replace(fieldName + SwaggerValidatorErrorMessage.not_object_type_str, "")
            message = `Input field: ${fieldName} has type: ${fieldType}, schema expected type object for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}\nInput:\n${JSON.stringify(data)}\nSchema:\n${JSON.stringify(model)}`
        } else if (message.includes(SwaggerValidatorErrorMessage.not_array_type_str)) {
            fieldName = message.slice(0, message.indexOf(SwaggerValidatorErrorMessage.not_array_type_str))
            message = `Schema expected input field: ${fieldName} to be an array for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}\nInput:\n${JSON.stringify(data)}\nSchema:\n${JSON.stringify(model)}`
        } else if (message.includes(SwaggerValidatorErrorMessage.required_field_no_value_str)) {
            fieldName = message.slice(0, message.indexOf(SwaggerValidatorErrorMessage.required_field_no_value_str))
            message = `Input is missing required field: ${fieldName} for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}\nInput:\n${JSON.stringify(data)}\nSchema:\n${JSON.stringify(model)}`
        } else if (message.includes(SwaggerValidatorErrorMessage.required_field_missing_schema_str)) {
            fieldName = message.replace(SwaggerValidatorErrorMessage.required_field_missing_schema_str, "")
            message = `Missing/invalid schema definition for required field: ${fieldName} for procedure: ${procedureName} in kind: ${kind_name} with provider prefix: ${provider_prefix} and version: ${provider_version}\nInput:\n${JSON.stringify(data)}\nSchema:\n${JSON.stringify(model)}`
        }
        errors[i].message = message
    }
}

const SwaggerModelValidator = require('swagger-model-validator');

export interface Validator {
    validate_uuid(kind: Kind, uuid: string): void
    validate_metadata_extension(extension_structure: Data_Description, metadata: Metadata | undefined, allowExtraProps: boolean): void
    validate_spec(provider: Provider, spec: Spec, kind: Kind, allowExtraProps: boolean): void
    validate_sfs(provider: Provider): void
    validate_status(provider: Provider, entity_ref: Entity_Reference, status: Status): void
    validate_provider(provider: Provider): void
    validate(provider_prefix: string, provider_version: string, kind_name: string, data: any, model: any | undefined, models: any, allowExtraProps: boolean, schemaName: string, procedureName?: string): void
}

export class ValidatorImpl {
    private validator = new SwaggerModelValidator();

    protected constructor(private procedural_signature_schema: Data_Description, private provider_schema: Data_Description) {
    }

    public static create() {
        const procedural_signature_schema = loadSchema("./schemas/procedural_signature.yaml")
        const provider_schema = loadSchema("./schemas/provider_schema.yaml")
        return new ValidatorImpl(procedural_signature_schema, provider_schema)
    }

    public validate_uuid(kind: Kind, uuid: string) {
        const validation_pattern = kind.uuid_validation_pattern
        if (validation_pattern === undefined) {
            if (!uuid_validate(uuid)) {
                throw new Error(`Invalid entity UUID\nEntity Info:${ new EntityLoggingInfo('', '', kind.name, { "entity_uuid": uuid }).toString() }`)
            }
        } else {
            const regex = new RegExp(validation_pattern, 'g')
            if (!regex.test(uuid)) {
                const additional_info = { "entity_uuid": uuid, "uuid_validation_pattern": validation_pattern }
                throw new Error(`Entity UUID does not match the pattern\nEntity Info:${ new EntityLoggingInfo('', '', kind.name, additional_info).toString() }`)
            }
        }
    }

    public validate_metadata_extension(extension_structure: Data_Description, metadata: Metadata | undefined, allowExtraProps: boolean) {
        if (metadata === undefined) {
            return
        }
        if (extension_structure === undefined || extension_structure === null || isEmpty(extension_structure)) {
            return
        }
        if (metadata.extension !== undefined && metadata.extension !== null && typeof metadata.extension !== "object") {
            const additional_info = { "entity_uuid": uuid.toString(), "metadata_extension": JSON.stringify(metadata.extension) }
            throw new ValidationError([{"name": "Error", message: `Metadata extension should be an object for entity`}], metadata.provider_prefix, metadata.provider_version, metadata.kind, additional_info)
        }
        if (metadata.extension === undefined || metadata.extension === null || isEmpty(metadata.extension)) {
            throw new ValidationError([{"name": "Error", message: `Metadata extension is not specified for entity`}], metadata.provider_prefix, metadata.provider_version, metadata.kind, { "entity_uuid": metadata.uuid})
        }
        const schemas: any = Object.assign({}, extension_structure);
        this.validate(metadata.provider_prefix, metadata.provider_version, metadata.kind, metadata.extension, Object.values(extension_structure)[0], schemas,
            allowExtraProps, Object.keys(extension_structure)[0], this.validate_metadata_extension.name);
    }

    public validate_spec(provider: Provider, spec: Spec, kind: Kind, allowExtraProps: boolean) {
        const schemas: any = cloneDeep(kind.kind_structure)
        // remove any status-only field from the schema to pass to validator
        this.remove_schema_fields(schemas, "status-only")
        this.validate(provider.prefix, provider.version, kind.name, spec, Object.values(schemas)[0], schemas,
            allowExtraProps, Object.keys(schemas)[0], this.validate_spec.name);
    }

   /**
     * Recursively removes a field from properties if it has to be shown only for the opposite type.
     * @param schema - schema to remove the fields from.
     * @param fieldName - type of x-papiea value spec-only|status-only.
     */
    remove_schema_fields(schema: any, fieldName: string) {
        for (let prop in schema) {
            if (typeof schema[prop] === 'object' && "x-papiea" in schema[prop] && schema[prop]["x-papiea"] === fieldName) {
                delete schema[prop]
            } else if (typeof schema[prop] === 'object')
                this.remove_schema_fields(schema[prop], fieldName)
        }
    }

    public async validate_status(provider: Provider, entity_ref: Entity_Reference, status: Status) {
        if (status === undefined || isEmpty(status)) {
            throw new ValidationError([new Error(`Status body is undefined for entity, please use null fields instead`)], provider.prefix, provider.version, entity_ref.kind, { "entity_uuid": entity_ref.uuid })
        }
        const kind = provider.kinds.find((kind: Kind) => kind.name === entity_ref.kind);
        const allowExtraProps = provider.allowExtraProps;
        if (kind === undefined) {
            throw new Error(`Unable to find kindin provider\nEntity Info:${ new EntityLoggingInfo(provider.prefix, provider.version, entity_ref.kind, { "entity_uuid": entity_ref.uuid }).toString() }`);
        }
        const schemas: any = Object.assign({}, kind.kind_structure);
        this.validate(provider.prefix, provider.version, kind.name, status, Object.values(kind.kind_structure)[0], schemas,
            allowExtraProps, Object.keys(kind.kind_structure)[0], this.validate_status.name);
    }

    public validate_sfs(provider: Provider) {
        for (let kind of provider.kinds) {
            if (kind.intentful_behaviour === IntentfulBehaviour.Differ) {
                // Throws an exception if it fails
                kind.intentful_signatures.forEach(sig => SFSCompiler.try_parse_sfs(sig.signature, kind.name))
            }
        }
    }

    public validate_provider(provider: Provider) {
        const schemas = {}
        Object.assign(schemas, this.provider_schema)
        Object.assign(schemas, this.procedural_signature_schema)
        this.validate(
            provider.prefix, provider.version, 'Provider',
            provider, Object.values(this.provider_schema)[0],
            schemas, true, Object.keys(this.provider_schema)[0], this.validate_provider.name, true)
        Object.values(provider.procedures).forEach(proc => {
            this.validate(
                provider.prefix, provider.version, 'ProviderProcedure',
                proc, Object.values(this.procedural_signature_schema)[0],
                schemas, true, Object.keys(this.procedural_signature_schema)[0],
                proc.name, true)
        })
        provider.kinds.forEach(kind => {
            Object.values(kind.kind_procedures).forEach(proc => {
                this.validate(
                    provider.prefix, provider.version, kind.name,
                    proc, Object.values(this.procedural_signature_schema)[0],
                    schemas, true, Object.keys(this.procedural_signature_schema)[0],
                    proc.name, true)
            })
            Object.values(kind.entity_procedures).forEach(proc => {
                this.validate(
                    provider.prefix, provider.version, kind.name,
                    proc, Object.values(this.procedural_signature_schema)[0],
                    schemas, true, Object.keys(this.procedural_signature_schema)[0],
                    proc.name, true)
            })
            Object.values(kind.intentful_signatures).forEach(proc => {
                this.validate(
                    provider.prefix, provider.version, kind.name,
                    proc, Object.values(this.procedural_signature_schema)[0],
                    schemas, true, Object.keys(this.procedural_signature_schema)[0],
                    proc.name, true)
            })
            // Assumption: Kind cannot have more than one kind structure associated with it
            const entity_name = Object.keys(kind.kind_structure)[0]
            this.validate_kind_structure(kind.kind_structure, entity_name)
        })
    }

    validate_kind_structure(schema: Data_Description, entity_name: string) {
        const x_papiea_field = "x-papiea"
        const status_only_value = FieldBehavior.StatusOnly
        // x_papiea_field property have only status_only_value value
        this.validate_field_value(schema[entity_name], x_papiea_field, [status_only_value])
        this.validate_spec_only_structure(schema[entity_name])
        // status-only fields cannot be required in schema
        this.validate_status_only_field(schema, entity_name)
    }

    validate_field_value(schema: Data_Description, field_name: string, possible_values: string[]) {
        for (let prop in schema) {
            if (typeof schema[prop] === "object") {
                if (field_name in schema[prop]) {
                    const value = schema[prop][field_name]
                    if (!possible_values.includes(value)) {
                        let message = `${field_name} has wrong value: ${value}, `
                        if (possible_values.length > 0) {
                            message += `correct values include: ${possible_values.toString()}`
                        } else {
                            message += "the field should not be present"
                        }
                        throw new ValidationError([{
                            name: "Error",
                            message: message
                        }], '', '', '')
                    }
                } else {
                    this.validate_field_value(schema[prop], field_name, possible_values)
                }

            }
        }
    }

    validate_spec_only_structure(entity: Data_Description) {
        const spec_only_value = "spec-only"
        const x_papiea_entity_field = "x-papiea-entity"
        const x_papiea_field = "x-papiea"
        if (typeof entity === "object" && entity.hasOwnProperty(x_papiea_entity_field) && entity[x_papiea_entity_field] === spec_only_value) {
            // spec-only entity can't have x_papiea_field values
            this.validate_field_value(entity.properties, x_papiea_field, [])
        }
    }

    validate_status_only_field(schema: Data_Description, entity_name: string) {
        try {
            for(let field in schema) {
                const field_schema = schema[field]
                if (field_schema.hasOwnProperty("type")) {
                    if (field_schema["type"] === "object") {
                        if (field_schema.hasOwnProperty("required") && field_schema.hasOwnProperty("properties")) {
                            for (let req_field of field_schema["required"]) {
                                if (field_schema["properties"][req_field].hasOwnProperty("x-papiea") && field_schema["properties"][req_field]["x-papiea"] === "status-only") {
                                    throw new ValidationError([{
                                        name: "ValidationError",
                                        message: `Field: ${req_field} of type 'status-only' is set to be required for entity: ${entity_name}. Required fields cannot be 'status-only'`
                                    }], '', '', '')
                                }
                            }
                        }
                        this.validate_status_only_field(field_schema["properties"], entity_name)
                    }
                    if (field_schema["type"] === "array") {
                        if (field_schema.hasOwnProperty("items") && field_schema["items"].hasOwnProperty("type")) {
                            if (field_schema["items"]["type"].includes("object") && field_schema["items"].hasOwnProperty("required") && field_schema["items"].hasOwnProperty("properties")) {
                                for (let req_field of field_schema["items"]["required"]) {
                                    if (field_schema["items"]["properties"][req_field].hasOwnProperty("x-papiea") && field_schema["items"]["properties"][req_field]["x-papiea"] === "status-only") {
                                        throw new ValidationError([{
                                            name: "ValidationError",
                                            message: `Field: ${req_field} of type 'status-only' is set to be required for entity: ${entity_name}. Required fields cannot be 'status-only'`
                                        }], '', '', '')
                                    }
                                }
                                this.validate_status_only_field(field_schema["items"]["properties"], entity_name)
                            }
                        }
                    }
                }
            }
        } catch (e) {
            throw (e)
        }
    }

    public validate(
        provider_prefix: string, provider_version: string, kind_name: string,
        data: any, model: any | undefined, models: any,
        allowExtraProps: boolean, schemaName: string,
        procedureName?: string, allowBlankTarget: boolean = false) {
        const validatorDenyExtraProps = !allowExtraProps
        if (modelIsEmpty(model)) {
            if (isEmpty(data)) {
                return {valid: true}
            } else {
                const additional_info = { "procedure_name": procedureName ?? '', "schema_name": schemaName, "received_input": JSON.stringify(data) }
                throw new ValidationError([{
                    name: "Error",
                    message: procedureName !== undefined
                        ? `Procedure was expecting empty object`
                        : `Schema was expecting empty object`
                }], provider_prefix, provider_version, kind_name, additional_info)
            }
        }
        if (model !== undefined && model !== null) {
            if (data === null || isEmpty(data)) {
                if (modelIsNullable(model)) {
                    // Model has fields but none of those are required
                    return {valid: true}
                } else {
                    // Model has required fields expecting non-empty inputON.stringify(data))
                    const additional_info = { "procedure_name": procedureName ?? '', "schema_name": schemaName, "received_input": JSON.stringify(data) }
                    throw new ValidationError([{
                        name: "Error",
                        message: procedureName !== undefined
                            ? `Procedure was expecting non-empty object`
                            : `Schema was expecting non-empty object`
                    }], provider_prefix, provider_version, kind_name, additional_info)
                }
            }

            const res = this.validator.validate(data, model, models, allowBlankTarget, validatorDenyExtraProps);
            if (!res.valid) {
                convertValidatorMessagesToPapieaMessages(provider_prefix, provider_version, kind_name, procedureName ?? 'Procedure', res.errors, data, model)
                throw new ValidationError(res.errors, provider_prefix, provider_version, kind_name, { "procedure_name": procedureName ?? '' });
            }
            return res
        } else {
            if (data !== undefined && data !== null && data !== "" && !(Object.entries(data).length === 0 && data.constructor === Object)) {
                const additional_info = { "procedure_name": procedureName ?? '', "schema_name": schemaName, "received_input": JSON.stringify(data) }
                throw new ValidationError([{
                    name: "Error",
                    message: procedureName !== undefined
                        ? `Procedure was expecting type void`
                        : `Schema was expecting type void`
                }], provider_prefix, provider_version, kind_name, additional_info)
            }
        }
    }
}

function loadSchema(schemaPath: string): any {
    return load(readFileSync(resolve(__dirname, schemaPath), "utf-8"));
}
