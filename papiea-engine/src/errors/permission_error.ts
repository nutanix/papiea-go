import { EntityLoggingInfo } from "papiea-backend-utils";

export class PermissionDeniedError extends Error {
    message: string;
    entity_info: EntityLoggingInfo;

    constructor(message: string, provider_prefix: string, provider_version: string, kind_name: string, additional_info?: { [key: string]: string; }) {
        super("Permission Denied");
        this.message = message;
        this.entity_info = new EntityLoggingInfo(provider_prefix, provider_version, kind_name, additional_info);
        Object.setPrototypeOf(this, PermissionDeniedError.prototype);
    }
}

export class UnauthorizedError extends Error {
    message: string;
    entity_info: EntityLoggingInfo;

    constructor(message: string, provider_prefix: string, provider_version: string, kind_name: string, additional_info?: { [key: string]: string; }) {
        super("Unauthorized");
        this.message = message;
        this.entity_info = new EntityLoggingInfo(provider_prefix, provider_version, kind_name, additional_info);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}