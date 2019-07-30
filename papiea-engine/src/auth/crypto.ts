const crypto = require("crypto");

export function createHash(obj: any): string {
    return crypto.createHash('sha256')
        .update(JSON.stringify(obj)).digest('base64');
}