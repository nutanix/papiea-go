import { ValidationError } from "../errors/validation_error";

const SwaggerModelValidator = require('swagger-model-validator');

export interface Validator {
    validate(data: any, model: any | undefined, models: any, allowExtraProps: boolean): void
}

export class ValidatorImpl {
    private validator = new SwaggerModelValidator();

    constructor() {
    }

    validate(data: any, model: any | undefined, models: any, allowExtraProps: boolean) {
        const validatorDenyExtraProps = !allowExtraProps
        const allowBlankTarget = false
        if (model) {
            const res = this.validator.validate(data, model, models, allowBlankTarget, validatorDenyExtraProps);
            if (!res.valid) {
                throw new ValidationError(res.errors);
            }
            return res
        } else {
            if (data !== undefined && data !== null && data !== "" && !(Object.entries(data).length === 0 && data.constructor === Object)) {
                throw new ValidationError([{
                    name: "Error",
                    message: "Function was expecting output of type void"
                }])
            }
        }
    }
}