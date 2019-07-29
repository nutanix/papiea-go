import { Maybe } from "../utils/utils";
import { ValidationError } from "../errors/validation_error";

const SwaggerModelValidator = require('swagger-model-validator');

export class Validator {
    private validator: any;
    private readonly disallowExtraProps: boolean;

    constructor(disallowExtraProps: boolean) {
        this.disallowExtraProps = disallowExtraProps;
        this.validator = new SwaggerModelValidator();
    }

    validate(data: any, model: Maybe<any>, models: any) {
        model.mapOrElse((val) => {
            const res = this.validator.validate(data, val, models, false, this.disallowExtraProps);
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