import { SortParams } from "../entity/entity_api_impl"
import { ValidationError } from "../errors/validation_error"

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

export function processSortQuery(query: string | undefined): undefined | SortParams {
    if (query === undefined) {
        return undefined;
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

export function safeJSONParse(chunk: string): Object | null {
    try {
        return JSON.parse(chunk)
    } catch (e) {
        console.error(`Safe json parse failed: ${e}, Falling back to undefined`)
        return null
    }
}