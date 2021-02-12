import { ValidationError } from "./validation_error"
import { AxiosError } from "axios"
import { isAxiosError } from "../utils/utils"
import { EntityLoggingInfo } from "papiea-backend-utils";

export class ProcedureInvocationError extends Error {
    errors: { [key: string]: any }[];
    status: number;
    entity_info: EntityLoggingInfo;

    protected constructor(errors: { [key: string]: any }[], status: number, entity_info: EntityLoggingInfo) {
        const messages = errors.map(x => x.message);
        super(JSON.stringify(messages));
        Object.setPrototypeOf(this, ProcedureInvocationError.prototype);
        this.errors = errors;
        this.status = status;
        this.name = "ProcedureInvocationError";
        this.entity_info = entity_info;
    }

    static fromError(err: AxiosError, provider_prefix: string, provider_version: string, kind_name: string, additional_info?: { [key: string]: string; }, status?: number): ProcedureInvocationError
    static fromError(err: ValidationError, provider_prefix: string, provider_version: string, kind_name: string, additional_info?: { [key: string]: string; }, status?: number): ProcedureInvocationError
    static fromError(err: Error, provider_prefix: string, provider_version: string, kind_name: string, additional_info?: { [key: string]: string; }, status?: number): ProcedureInvocationError {
        let entity_info = new EntityLoggingInfo(provider_prefix, provider_version, kind_name, additional_info)
        if (isAxiosError(err)) {
            return new ProcedureInvocationError([{
                message: err.response?.data.message,
                errors: err.response?.data.errors,
                stacktrace: err.response?.data.stacktrace
            }], err.response?.status ?? 500, entity_info)
        } else if (err instanceof ValidationError) {
            return new ProcedureInvocationError(
                err.errors.map(e => ({
                    message: e,
                    errors: {},
                    stacktrace: err.stack
                }))
            , status || 500, entity_info)
        } else {
            return new ProcedureInvocationError([{
                message: "Unknown error during procedure invocation",
                errors: {},
                stacktrace: err.stack
            }], status || 500, entity_info)
        }
    }
}
