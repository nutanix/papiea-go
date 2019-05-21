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

    constructor() {
        this.validator = new SwaggerModelValidator();
    }

    validate(data: any, model: any, models: any): any {
        const res = this.validator.validate(data, model, models);
        if (!res.valid) {
            throw new ValidationError(res.errors);
        }
    }
}