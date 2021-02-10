export class PermissionDeniedError extends Error {
    message: string;

    constructor(message: string) {
        super("Permission Denied");
        this.message = message;
        Object.setPrototypeOf(this, PermissionDeniedError.prototype);
    }
}

export class UnauthorizedError extends Error {
    message: string;

    constructor(message: string) {
        super("Unauthorized");
        this.message = message;
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}