import { EntityLoggingInfo } from "papiea-backend-utils";

export class BadRequestError extends Error {
    message: string;
    entity_info: EntityLoggingInfo;

    constructor(message: string, provider_prefix: string, provider_version: string, kind_name: string, additional_info?: { [key: string]: string; }) {
        super("Bad Request");
        this.message = message;
        this.entity_info = new EntityLoggingInfo(provider_prefix, provider_version, kind_name, additional_info)
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}