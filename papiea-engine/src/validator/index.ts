import { Maybe } from "../utils/utils";

const SwaggerModelValidator = require('swagger-model-validator');

export class ValidationError extends Error {
    errors: string[];

    constructor(errors: Error[]) {
        const messages = errors.map(x => x.message);
        super(JSON.stringify(messages));
        Object.setPrototypeOf(this, ValidationError.prototype);
        this.errors = messages;
    }
}

export class Validator {
    private static validator = new SwaggerModelValidator();

    constructor() {
    }

    static validate(data: any, model: Maybe<any>, models: any, allowExtraProps: boolean) {
        const validatorDenyExtraProps = !allowExtraProps;
        model.mapOrElse((val) => {
            const res = Validator.validator.validate(data, val, models, false, validatorDenyExtraProps);
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
}