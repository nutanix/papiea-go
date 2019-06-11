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
    private validator: any;
    private readonly disallowExtraProps: boolean;

    constructor(disallowExtraProps: boolean) {
        this.disallowExtraProps = disallowExtraProps;
        this.validator = new SwaggerModelValidator();
    }

    validate(data: any, model: Maybe<any>, models: any) {
        console.dir(model);
        model.mapOrElse((val) => {
            const res = this.validator.validate(data, val, models, false, this.disallowExtraProps);
            if (!res.valid) {
                throw new ValidationError(res.errors);
            }
            return Maybe.fromValue(res)
        }, () => {
            if (data !== undefined && data !== null) {
                throw new ValidationError([{
                    name: "Error",
                    message: "Function was expecting output of type void"
                }])
            }
        })
    }
}