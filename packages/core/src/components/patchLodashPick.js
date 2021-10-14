import { get, set, uniq } from "lodash";

// Original pick converts object to array, if picking number keys:
// _.pick({ a: { 4: "foo" } }, ["a.4"]);
// => {a: (5) [empty × 4, 'foo']}

const initialValue = value => (Array.isArray(value) ? [] : {});

export default function pick(object, paths) {
  const data = initialValue(object);

  const parentPaths = uniq(
    paths.map(path =>
      path
        .split(".")
        .slice(0, -1)
        .join(".")
    )
  ).filter(Boolean);

  for (const parentPath of parentPaths) {
    set(data, parentPath, initialValue(get(object, parentPath)));
  }

  for (const path of paths) {
    set(data, path, get(object, path));
  }

  if (Array.isArray(object)) {
    return Object.keys(data).map(key => data[key]);
  }

  return data;
}
