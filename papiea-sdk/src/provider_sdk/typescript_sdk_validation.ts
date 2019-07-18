import { Data_Description } from "papiea-core";
import { Maybe } from "./typescript_sdk_utils";
import { ValidationError } from "./typescript_sdk_exceptions";

const SwaggerModelValidator = require('swagger-model-validator');

export class Validator {
    private static validator = new SwaggerModelValidator();

    constructor() {
    }

    static validate(data: any, model: Maybe<any>, models: any, allowExtraProps: boolean) {
        model.mapOrElse((val) => {
            const res = this.validator.validate(data, val, models, false, allowExtraProps);
            if (!res.valid) {
                throw new ValidationError(res.errors);
            }
            return Maybe.fromValue(res)
        }, () => {
            if (data !== undefined && data !== null && data !== "" && !(Object.entries(data).length === 0 && data.constructor === Object)) {
                throw new ValidationError([{
                    name: "Error",
                    message: "Function was expecting output of type void"
                }])
            }
        })
    }

    static build_schemas(argument: Data_Description, result: Data_Description) {
        const schemas = {};
        Object.assign(schemas, argument);
        Object.assign(schemas, result);
        return schemas;
    }
}