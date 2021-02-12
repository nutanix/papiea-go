import { EntityLoggingInfo } from "papiea-backend-utils";

export class OnActionError extends Error {
    static ON_CREATE_ACTION_MSG = "On Create couldn't be called;"
    static ON_DELETE_ACTION_MSG = "On Delete couldn't be called;"
    static UNKNOWN_ACTION_MSG = "Action couldn't be called;"

    message: string;
    entity_info: EntityLoggingInfo;

    constructor(message: string, entity_info: EntityLoggingInfo) {
        super(message)
        this.message = message
        this.entity_info = entity_info
    }

    public static create(reason: string, procedure_name: string, provider_prefix: string, provider_version: string, kind_name: string, additional_info?: { [key: string]: string; }) {
        let entity_info = new EntityLoggingInfo(provider_prefix, provider_version, kind_name, additional_info)
        if (kind_name === undefined || kind_name === null) {
            return new OnActionError(`${this.UNKNOWN_ACTION_MSG} ${reason}`, entity_info)
        }
        const on_create = OnActionError.onCreateName(kind_name)
        const on_delete = OnActionError.onDeleteName(kind_name)
        let message: string
        if (procedure_name === on_create) {
            message = `${this.ON_CREATE_ACTION_MSG} ${reason}`
        } else if (procedure_name === on_delete) {
            message = `${this.ON_DELETE_ACTION_MSG} ${reason}`
        } else {
            message = `${this.UNKNOWN_ACTION_MSG} ${reason}`
        }
        return new OnActionError(message, entity_info)
    }

    private static onCreateName(kind_name: string) {
        return `__${kind_name}_create`
    }

    private static onDeleteName(kind_name: string) {
        return `__${kind_name}_delete`
    }
}
