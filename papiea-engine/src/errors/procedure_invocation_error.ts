import { ValidationError } from "./validation_error"
import { AxiosError } from "axios"
import { isAxiosError } from "../utils/utils"

export class ProcedureInvocationError extends Error {
    errors: { [key: string]: any }[];
    status: number;

    protected constructor(errors: { [key: string]: any }[], status: number) {
        super(JSON.stringify(errors));
        Object.setPrototypeOf(this, ProcedureInvocationError.prototype);
        this.errors = errors;
        this.status = status;
    }

    static fromError(err: AxiosError, status?: number): ProcedureInvocationError
    static fromError(err: ValidationError, status?: number): ProcedureInvocationError
    static fromError(err: Error, status?: number): ProcedureInvocationError {
        if (isAxiosError(err)) {
            return new ProcedureInvocationError([{
                message: err.response!.data.message,
                errors: err.response!.data.errors,
                stacktrace: err.response!.data.stacktrace
            }], err.response!.status)
        } else if (err instanceof ValidationError) {
            return new ProcedureInvocationError(err.errors.map(e => {
                return { message: e }
            }), status || 500)
        } else {
            return new ProcedureInvocationError([{
                message: "Unknown error during procedure invocation",
                errors: {},
                stacktrace: err.stack
            }], status || 500)
        }
    }
}