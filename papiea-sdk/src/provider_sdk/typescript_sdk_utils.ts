import { Metadata } from "papiea-core";
import { Entity_Reference } from "papiea-core/build/core";

export class Maybe<T> {
    private constructor(private value: T | null) {}

    static some<T>(value: T) {
        if (!value) {
            throw Error("Provided value must not be empty");
        }
        return new Maybe(value);
    }

    static none<T>() {
        return new Maybe<T>(null);
    }

    static fromValue<T>(value: T) {
        return value && !isEmpty(value) ? Maybe.some(value) : Maybe.none<T>();
    }

    mapOrElse<R>(someFn: (wrapped: T) => Maybe<R>, noneFn: () => void) {
        if (this.value === null) {
            noneFn();
        } else {
            someFn(this.value);
        }
    }
}

export function isEmpty(obj: any) {
    for(let key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

export function isMetadataArray(entity: any): entity is Metadata[] {
    // @ts-ignore
    return Array.isArray(entity) && entity[0].spec_version !== undefined;
}

export function isEntityRefArray(entity: any): entity is Entity_Reference[] {
    return Array.isArray(entity) && entity[0].uuid !== undefined;
}

export function isEntityRef(entity: any): entity is Entity_Reference[] {
    // @ts-ignore
    return entity.uuid !== undefined;
}

export function isMetadata(entity: any): entity is Entity_Reference[] {
    // @ts-ignore
    return entity.spec_version !== undefined;
}