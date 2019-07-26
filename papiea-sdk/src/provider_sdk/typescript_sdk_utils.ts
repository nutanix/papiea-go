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