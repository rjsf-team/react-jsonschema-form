/** Stringifies an `object`, sorts object fields in consistent order before stringifying it.
 *
 * @param object - The object for which the sorted stringify is desired
 * @returns - The stringified object with keys sorted in a consistent order
 */
export default function sortedJSONStringify(object: unknown): string {
  const allKeys = new Set<string>();
  // solution source: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify/53593328#53593328
  JSON.stringify(object, (key, value) => {
    allKeys.add(key);
    return value;
  });
  return JSON.stringify(object, Array.from(allKeys).sort());
}
