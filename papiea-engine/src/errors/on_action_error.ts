export class OnActionError extends Error {
    static ON_CREATE = "__create"
    static ON_DELETE = "__delete"

    message: string;

    constructor(reason: string, procedure_name: string) {
        let message: string
        if (procedure_name === OnActionError.ON_CREATE) {
            message = `On Create couldn't be called; ${reason}`
        } else if (procedure_name === OnActionError.ON_DELETE) {
            message = `On Delete couldn't be called; ${reason}`
        } else {
            message = `Unknown action couldn't be called; ${reason}`
        }
        super(message)
        this.message = message
    }
}