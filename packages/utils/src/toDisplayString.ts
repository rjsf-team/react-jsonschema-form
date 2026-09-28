/** Converts `value` to a string the way `String()` does for primitives, functions and errors, but spells other objects
 * and arrays out as JSON, since `String()` would turn every object into the same `[object Object]`.
 *
 * @param value - The value to convert
 * @returns - The string form of `value`
 */
export default function toDisplayString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol' ||
    value === undefined ||
    value === null
  ) {
    return String(value);
  }
  if (typeof value === 'function' || value instanceof Error) {
    return value.toString();
  }
  return JSON.stringify(value);
}
