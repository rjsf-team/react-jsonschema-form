// Original pick converts object to array, if picking number keys:
// _.pick({ a: { 4: "foo" } }, ["a.4"]);
// => {a: (5) [empty × 4, 'foo']}

const initialValue = value => (Array.isArray(value) ? [] : {});

export default function pick(object, paths) {
  const data = initialValue(object);

  for (const path of paths) {
    let target = data;
    let source = object || {};

    const parts = path.split(".");
    const lastIndex = parts.length - 1;

    for (let index = 0; index < parts.length; ++index) {
      const part = parts[index];

      if (target && !(part in target)) {
        const value = source[part];
        const isLastPart = index === lastIndex;
        target[part] = isLastPart ? value : initialValue(value);
      }

      if (target) {
        target = target[part];
      }
      source = source[part] || {};
    }
  }

  return data;
}
