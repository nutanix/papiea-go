import { EntityLoggingInfo } from "papiea-backend-utils";

export class ValidationError extends Error {
    errors: string[];
    entity_info: EntityLoggingInfo;

    constructor(errors: Error[], provider_prefix: string, provider_version: string, kind_name: string, additional_info?: { [key: string]: string; }) {
        const messages = errors.map(x => x.message);
        super(JSON.stringify(messages));
        Object.setPrototypeOf(this, ValidationError.prototype);
        this.errors = messages;
        this.entity_info = new EntityLoggingInfo(provider_prefix, provider_version, kind_name, additional_info);
    }
}