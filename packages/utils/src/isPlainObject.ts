/** Determines whether `thing` is a plain object, i.e. one created by the `Object` constructor or with a `null`
 * prototype. Unlike `isObject()`, class instances such as `Error` are not plain objects, which matters when
 * recursively walking a structure whose nested values are expected to be plain data.
 *
 * @param thing - The thing to check to see whether it is a plain object
 * @returns - True if it is a plain object, otherwise false
 */
export default function isPlainObject(thing: unknown): thing is Record<string, unknown> {
  if (typeof thing !== 'object' || thing === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(thing);
  return proto === null || proto === Object.prototype;
}
