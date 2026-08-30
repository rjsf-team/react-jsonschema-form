import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Hashes a string using the algorithm based on Java's hashing function.
 * JS has no built-in hashing function, so rolling our own
 *  based on Java's hashing fn:
 *  http://www.java2s.com/example/nodejs-utility-method/string-hash/hashcode-4dc2b.html
 *
 * @param string - The string for which to get the hash
 * @returns - The resulting hash of the string in hex format
 */
export function hashString(string: string): string {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    const chr = string.charCodeAt(i);
    // oxlint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + chr;
    // oxlint-disable-next-line no-bitwise
    hash &= hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/** Recursively serializes a value to JSON with object keys sorted alphabetically to produce
 * a stable string representation.
 *
 * @param object - The object for which the sorted stringify is desired
 * @returns - The stringified object with keys sorted in a consistent order
 */
export function sortedJSONStringify(object: unknown): string {
  function shouldIncludeValue(value: unknown) {
    return value !== undefined && typeof value !== 'function' && typeof value !== 'symbol';
  }

  if (Array.isArray(object)) {
    return `[${object.map((x) => (x === undefined ? 'undefined' : sortedJSONStringify(x))).join(',')}]`;
  }
  if (object === null || typeof object !== 'object') {
    return JSON.stringify(typeof object === 'function' ? null : object); // Normalise functions
  }

  const record = object as Record<string, unknown>;
  const sortedValues = Object.keys(record)
    .sort()
    .filter((key) => shouldIncludeValue(record[key]))
    .map((key) => `${JSON.stringify(key)}:${sortedJSONStringify(record[key])}`);
  return `{${sortedValues.join(',')}}`;
}

/** Stringifies an `object` and returns the hash of the resulting string. Sorts object fields
 * in consistent order before stringify to prevent different hash ids for the same object.
 *
 * @param object - The object for which the hash is desired
 * @returns - The string obtained from the hash of the stringified object
 */
export function hashObject(object: unknown): string {
  return hashString(sortedJSONStringify(object));
}

/** Stringifies the schema and returns the hash of the resulting string. Sorts schema fields
 * in consistent order before stringify to prevent different hash ids for the same schema.
 * Symbol-keyed properties (RJSF_REF_KEY, RJSF_REF_CYCLE_KEY, ADDITIONAL_PROPERTY_FLAG) are
 * automatically excluded by JSON.stringify, so no special filtering is needed.
 *
 * @param schema - The schema for which the hash is desired
 * @returns - The string obtained from the hash of the stringified schema
 */
export default function hashForSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S) {
  return hashString(sortedJSONStringify(schema));
}
