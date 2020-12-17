import { ErrorSchemas } from "papiea-core"

export function validate_error_codes(error_desc: ErrorSchemas | undefined) {
    if (error_desc) {
        for (let code of Object.keys(error_desc)) {
            const parsed_code = Number(code)
            if (!Number.isInteger(parsed_code) || !(parsed_code >= 400 && parsed_code <= 599)) {
                throw new Error(`Error description should feature status code in 4xx or 5xx`)
            }
        }
    }
}

export function get_papiea_version(): string {
    const packageJSON = require('../../package.json');
    const sdk_version: string = packageJSON.version.split('+')[0];
    return sdk_version;
}