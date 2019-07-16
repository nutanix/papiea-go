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

export type SortParams = { [key: string]: number };

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

export function processSortQuery(query: string | undefined) {
    if (query === undefined) {
        return {};
    }
    const processedQuery: SortParams = {};
    const splitFields = query.split(",");
    splitFields.forEach(fieldQuery => {
        const [field, sortOrd] = fieldQuery.split(":");
        switch (sortOrd) {
            case "asc":
                processedQuery[field] = 1;
                break;
            case "desc":
                processedQuery[field] = -1;
                break;
            case undefined:
                processedQuery[field] = 1;
                break;
            default:
                throw new ValidationError([new Error("Sorting key's value must be either 'asc' or 'desc'")])
        }
    });
    return processedQuery;
}

export function isEmpty(obj: any) {
    for(let key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}