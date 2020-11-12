import { AxiosError } from "axios"

export class InvocationError extends Error {
    status_code: number
    message: any
    errors: any[]

    public constructor(status_code: number, message: any, errors: any[], stack?: string) {
        super(message)
        Object.setPrototypeOf(this, InvocationError.prototype)
        this.status_code = status_code
        this.message = message
        this.errors = errors
        if (stack !== undefined) {
            this.stack = stack
        }
    }

    static fromError(status_code: number, e: SecurityApiError, custom_message?: string): InvocationError
    static fromError(status_code: number, e: AxiosError, custom_message?: string): InvocationError
    static fromError(status_code: number, e: Error, custom_message?: string): InvocationError {
        if (custom_message !== undefined) {
            return new InvocationError(status_code, custom_message, [], e.stack)
        }
        if (e instanceof SecurityApiError) {
            return new InvocationError(e.status || 500, e.message, e.errors, e.stack)
        }
        if (isAxiosError(e)) {
            return new InvocationError(e.response!.status, "Error while making request", e.response!.data?.errors)
        }
        return new InvocationError(status_code, e.message, [], e.stack)
    }

    toResponse() {
        return {
            errors: this.errors,
            message: this.message,
            stacktrace: this.stack
        }
    }
}

export class SecurityApiError extends Error {
    message: string
    errors: any[]
    status?: number
    stack?: string

    protected constructor(errors: any[], message: string, status?: number, stack?: string) {
        super(message)
        Object.setPrototypeOf(this, SecurityApiError.prototype);
        this.message = message;
        this.status = status
        this.errors = errors
        this.stack = stack
    }

    static fromError(e: Error, message: string): SecurityApiError {
        if (isAxiosError(e)) {
            if (e.response!.data.error) {
                return new SecurityApiError(e.response!.data?.error?.errors, message, e.response!.status)
            } else {
                return new SecurityApiError([e.response!.data], message, e.response!.status)
            }
        } else {
            return new SecurityApiError([e.message], message, undefined, e.stack)
        }
    }
}

function isAxiosError(e: Error): e is AxiosError {
    return e.hasOwnProperty("response");
}
