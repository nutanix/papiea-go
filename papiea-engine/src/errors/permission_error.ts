export class PermissionDeniedError extends Error {
    constructor() {
        super("Permission Denied");
        Object.setPrototypeOf(this, PermissionDeniedError.prototype);
    }
}

export class UnauthorizedError extends Error {
    constructor() {
        super("Unauthorized");
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}