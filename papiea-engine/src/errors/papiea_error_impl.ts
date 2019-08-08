import { PapieaError } from "papiea-core";
import { EntityNotFoundError } from "../databases/utils/errors";
import { ValidationError } from "./validation_error";
import { ProcedureInvocationError } from "./procedure_invocation_error";
import { PermissionDeniedError, UnauthorizedError } from "./permission_error";
import { BadRequestError } from "./bad_request_error";


export class PapieaErrorImpl implements PapieaError {
    error: {
        errors: { [key: string]: any }[],
        code: number
        message: string
    }

    constructor(code: number, errorMsg: string, errors?: { [key: string]: any }[]) {
        if (errors) {
            this.error = {
                code,
                errors,
                message: errorMsg
            }
        } else {
            this.error = {
                code,
                errors: [
                    { message: errorMsg }
                ],
                message: errorMsg
            }
        }

    }

    public get status(): number {
        return this.error.code
    }

    public toResponse() {
        return this
    }

    static create(err: Error) {
        let errorPayload: { message: string }[];
        switch (err.constructor) {
            case BadRequestError:
                return new PapieaErrorImpl(400, "Bad Request",
                    [{ message: err.message }])
            case ValidationError:
                errorPayload = (err as ValidationError).errors.map(description => {
                    return { message: description }
                })
                return new PapieaErrorImpl(400, "Validation failed.", errorPayload)
            case ProcedureInvocationError:
                return new PapieaErrorImpl((err as ProcedureInvocationError).status, "Procedure invocation failed.", (err as ProcedureInvocationError).errors)
            case EntityNotFoundError:
                return new PapieaErrorImpl(
                    404,
                    "Entity not found.",
                    [{ message: `Entity with kind: ${(err as EntityNotFoundError).kind}, uuid: ${(err as EntityNotFoundError).uuid} not found` }]
                )
            case UnauthorizedError:
                return new PapieaErrorImpl(401, "Unauthorized.")
            case PermissionDeniedError:
                return new PapieaErrorImpl(403, "Permission denied.")
            default:
                return new PapieaErrorImpl(500, `${err}.`)
        }
    }
}