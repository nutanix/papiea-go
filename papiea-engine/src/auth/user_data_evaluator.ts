import * as _ from 'lodash'

// Taken from https://git.coolaj86.com/coolaj86/atob.js/src/branch/master/node-atob.js#L3-L5
export function atob(str: string) {
    return Buffer.from(str, 'base64').toString('binary');
}

export function parseJwt(token: string): any {
    // partly from https://stackoverflow.com/a/38552302
    if (token) {
        const token_parts = token.split('.');

        const header_base64Url = token_parts[0];
        let header = {};
        if (header_base64Url) {
            const header_base64 = header_base64Url.replace(/-/g, '+').replace(/_/g, '/');
            header = JSON.parse(atob(header_base64))
        }

        const content_base64Url = token_parts[1];
        let content = {};
        if (content_base64Url) {
            const content_base64 = content_base64Url.replace(/-/g, '+').replace(/_/g, '/');
            content = JSON.parse(atob(content_base64))
        }
        return { header, content }
    }
    return { header: {}, content: {} }
}

function is_reference(line: any) {
    return (_.isString(line) && line[0] == '^')
}

function get_reference(line: any) {
    if (!is_reference(line)) throw new Error(`'${ line }' not a reference.`);
    return line.substring(1)
}

function is_function(line: any) {
    return (_.isString(line) && line[0] == "$")
}

function get_function(line: any) {
    if (!is_function(line)) throw new Error(`'${ line }' not a function.`);
    return line.substring(1)
}

function is_first_match(val: any) {
    return (_.isObject(val) && _.isEqual(_.keys(val), ['first_match']))
}

const funcNameParamRegex = /([^.]+)\(([^)]+)\)/;

function invoke_function(env: any, part: any) {
    const func = get_function(part);
    const matches = funcNameParamRegex.exec(func);

    switch ((matches && matches[1]) || func) {
        case 'JWT':
            return parseJwt(env);
        case 'find':
            if (!matches)
                throw Error("no params found for 'find' function");

            const [k, v] = matches[2].split(':');
            if (k && v) return _.find(env, (x: any) => x[k] == v);

            throw Error(`bad params found for 'find' function. ${ matches[2] }`);
        case 'bearer':
            if (!matches)
                throw Error("no params found for 'bearer' function");
            if (is_reference(matches[2])) {
                return `Bearer ${deref(env, matches[2])}`
            } else {
                return `Bearer ${matches[2]}`
            }
    }

}

export function deref(env: any, query_inp: any): any {
    //console.log("Inside with", query_inp)
    const is_func = is_function(query_inp);

    if (is_func) {
        return invoke_function(env, query_inp);
    }

    const reference = is_reference(query_inp);

    // If we are not a reference, than the input is already a const
    if (!reference) return query_inp;

    const query = get_reference(query_inp);

    // query is built on parts between the dots
    const parts = query.split('.');

    // define a lambda that process a single part
    const part_processor = (part_env: any, current_part: any) => {

        if (!part_env) return null;
        if (is_function(current_part)) {
            // Get parameters
            return invoke_function(part_env, current_part)

        } else { // current_part is an index into an object or array returned in part_env
            let value = part_env[current_part];

            if (!value)
                throw Error(`Variable, index or key '${ current_part }' not found`);

            if (is_first_match(value)) {
                return _.find(_.map(value.first_match, (x: any) => deref(env, x)))
            } else if (!is_reference(value)) {
                // If it is not a reference or a directive, then it is an already resolved value
                return value
            } else {
                // its a reference query, recursively process the query
                const r = deref(env, value);

                // memoize it by replacing the dereferenced value in the env for next executions
                env[current_part] = r;

                return r
            }
        }
    };

    // each part operates on the value returned by processing the previous part
    return _.reduce(parts, part_processor, env)
}

export function extract_property(token: any, oauth_description: any, property: string): any {
    const user_identifiers = oauth_description.oauth.user_info[property];
    let env:any = _.omit(oauth_description.oauth.user_info, [property]);

    env.token = token.token;

    return _.mapValues(user_identifiers, (v: any) => deref(env, v))
}

export function constructBearerTokenPath(property: string, token: string) {
    const parts = property.split("^");
    const pathValue = parts[1].slice(0, parts[1].length - 1);
    const obj: any = {};
    let current: any = obj;
    let prev: any = current;
    const dotNotationPath = pathValue.split(".");
    for (let i = 0; i < dotNotationPath.length; i++) {
        current[dotNotationPath[i]] = {};
        prev = current;
        current = current[dotNotationPath[i]]
    }
    prev[Object.keys(prev)[0]] = token;
    return obj;
}