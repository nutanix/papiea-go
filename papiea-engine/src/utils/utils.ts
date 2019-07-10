import { ValidationError } from "../validator";

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

function validatePaginationParams(offset: number | undefined, limit: number | undefined) {
    if (offset) {
        if (offset <= 0) {
            throw new ValidationError([new Error("Offset should not be less or equal to zero")])
        }
    }
    if (limit) {
        if (limit <= 0) {
            throw new ValidationError([new Error("Limit should not be less or equal to zero")])
        }
    }
}

export function processPaginationParams(offset: number | undefined, limit: number | undefined): [number, number] {
    let skip = 0;
    let size = 30;
    if (!offset && !limit) {
        validatePaginationParams(offset, limit);
        return [skip, size]
    }
    else if (!offset && limit) {
        validatePaginationParams(offset, limit);
        size = Number(limit);
        return [skip, size]
    }
    else if (offset && !limit) {
        validatePaginationParams(offset, limit);
        skip = Number(offset);
        return [skip, size]
    } else {
        validatePaginationParams(offset, limit);
        size = Number(limit);
        skip = Number(offset);
        return [skip, size]
    }

}

export function isEmpty(obj: any) {
    for(let key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}