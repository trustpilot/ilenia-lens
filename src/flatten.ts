function flatten(obj: any, out: { [keyof: string]: any } = {}, paths: string[] = []) {
    return Object.getOwnPropertyNames(obj).reduce((out, key) => {
        paths.push(key);
        if (typeof obj[key] === 'object') {
            flatten(obj[key], out, paths);
        } else {
            out[paths.join('.')] = obj[key];
        }
        paths.pop();
        return out;
    }, out);
}

export default flatten;
