export class ProcedureInvocationError extends Error {
    errors: string[];
    status: number;

    constructor(errors: string[], status: number) {
        super(JSON.stringify(errors));
        Object.setPrototypeOf(this, ProcedureInvocationError.prototype);
        this.errors = errors;
        this.status = status;
    }
}