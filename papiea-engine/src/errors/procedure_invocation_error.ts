export class ProcedureInvocationError extends Error {
    errors: { [key: string]: any }[];
    status: number;

    constructor(errors: { [key: string]: any }[], status: number) {
        super(JSON.stringify(errors));
        Object.setPrototypeOf(this, ProcedureInvocationError.prototype);
        this.errors = errors;
        this.status = status;
    }
}