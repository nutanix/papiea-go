// Shlomi: Moved encode here from mongo-dot-notation-tool and fixed it to not venture into vectors
// Need to add tests to this
function encode(value: any, keyChain: string[], result: any) {
    const isObject = (value: any)=> value && value.toString() === '[object Object]'
    const isArray = (value: any)=>  Array.isArray(value);
    let _key:any;

    if (!keyChain) {
        keyChain = [];
    }
    if (isArray(value)) {
        if (!result) {
            result = [];
        }

        for (var i = 0; i < value.length; i++) {
            result[i] = value[i];
        }
    } else if (isObject(value)) {
        if (!result) {
            result = {};
        }
        if (keyChain.length > 0 && Object.keys(value).length === 0) {
            result[keyChain.join('.')] = value
        }
        Object.keys(value).forEach(function (key) {
            let _keyChain = ([] as string[]).concat(keyChain);
            _keyChain.push(key);

            if (key.charAt(0) === '$') {
                if (isArray(value[key])) {
                    result[key] = value[key];
                } else if (isObject(value[key])) {
                    if (keyChain.length) {
                        _key = keyChain.join('.');
                        if (!result[_key]) {
                            result[_key] = {};
                        }
                        encode(value[key], [key], result[_key]);
                    } else {
                        encode(value[key], [key], result);
                    }
                } else {
                    _key = keyChain.join('.');
                    let _o: any = {};
                    _o[key] = value[key] as any;
                    if (result[_key]) {
                        Object.assign(result[_key], _o);
                    } else {
                        result[_key] = _o;
                    }
                }
            } else {
                if (isArray(value[key])) {
                    _key = _keyChain.join('.');
                    result[_key] = [];
                    encode(value[key], [], result[_key]);
                } else if (isObject(value[key])) {
                    encode(value[key], _keyChain, result);
                } else {
                    result[_keyChain.join('.')] = value[key];
                }
            }
        });
    } else {
        result = value;
    }

    return result;
}

const dotnotation = (x:any)=>encode(x, [], undefined)

export {
    dotnotation
}