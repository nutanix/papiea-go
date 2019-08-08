export class BadRequestError extends Error {
    message: string;

    constructor(message: string) {
        super("Bad Request");
        this.message = message;
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}