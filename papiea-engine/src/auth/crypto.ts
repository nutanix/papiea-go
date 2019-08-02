import { Secret } from "papiea-core";

const crypto = require("crypto");

export function createHash(obj: any): string {
    return crypto.createHash('sha256')
        .update(JSON.stringify(obj)).digest('base64');
}

export class SecretImpl implements Secret {
    private secret: any

    constructor(secret: any) {
        this.secret = secret
    }

    getSecret(): any {
        return this.secret
    }

    setSecret(secret: any) {
        this.secret = secret
    }
}