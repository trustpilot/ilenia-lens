export function flatten(
  obj: any,
  out: { [keyof: string]: any } = {},
  paths: string[] = []
) {
  return Object.getOwnPropertyNames(obj).reduce((out, key) => {
    paths.push(key);
    if (typeof obj[key] === "object") {
      flatten(obj[key], out, paths);
    } else {
      out[paths.join(".")] = obj[key];
    }
    paths.pop();
    return out;
  }, out);
}

export function reverseTraverse(lookUpString: string, key: string) {
  const translationIdPath: string[] = [key];
  let bracketIndex = 0;
  for (let i = lookUpString.length - 1; i >= 0; i--) {
    if (lookUpString[i] === "{") {
      if (bracketIndex === 0) {
        const slice = lookUpString.slice(0, i);
        const matches = slice.match(/"(.*?)"/g);
        if (!matches) {
          break;
        }
        const parentKey = matches[matches.length - 1].replace(/"/g, "");
        translationIdPath.push(parentKey);
      } else {
        bracketIndex -= 1;
      }
    }
    if (lookUpString[i] === "}") {
      bracketIndex += 1;
    }
  }
  return translationIdPath.reverse().join(".");
}
