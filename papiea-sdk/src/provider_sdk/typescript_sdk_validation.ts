import { Data_Description } from "papiea-core";

const SwaggerModelValidator = require('swagger-model-validator');

export class ValidationError extends Error {
    errors: string[];

    constructor(errors: Error[]) {
        const messages = errors.map(x => x.message);
        super(JSON.stringify(messages));
        Object.setPrototypeOf(this, ValidationError.prototype);
        this.errors = messages;
    }

    mapErr(fn: (e: string[]) => string) {
        const error_msg = fn(this.errors);
        console.error(error_msg);
        return {
            msg: error_msg,
            errors: this.errors
        }
    }
}

export class Validator {
    private validator: any;

    constructor() {
        this.validator = new SwaggerModelValidator();
    }

    validate(data: any, model: any, models: any): any {
        const res = this.validator.validate(data, model, models);
        if (!res.valid) {
            throw new ValidationError(res.errors);
        }
    }

    static build_schemas(argument: Data_Description, result: Data_Description) {
        const schemas = {};
        Object.assign(schemas, argument);
        Object.assign(schemas, result);
        return schemas;
    }
}