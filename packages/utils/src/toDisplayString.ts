import isPlainObject from './isPlainObject.ts';

/** Converts `value` to a string the way `String()` does, except that a plain object or an array is spelled out as
 * JSON, since `String()` would turn every plain object into the same `[object Object]`. Unlike `String()`, it throws
 * for a plain object or array that `JSON.stringify()` can't convert, such as one that is circular or holds a `BigInt`.
 *
 * @param value - The value to convert
 * @returns - The string form of `value`
 * @throws - The error `JSON.stringify()` throws for a circular plain object or array, or one that holds a `BigInt`
 */
export default function toDisplayString(value: unknown): string {
  if (Array.isArray(value) || isPlainObject(value)) {
    return JSON.stringify(value);
  }
  return String(value);
}
