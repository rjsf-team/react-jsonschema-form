import type { GenericObjectType } from './types.ts';

/** Writes `value` at `key` of a plain object `obj` as an own, enumerable data property. A plain assignment to a
 * JSON-sourced `__proto__` key would reach the prototype setter and re-point `obj`'s prototype instead of adding the
 * key, so that key goes through `Object.defineProperty`. Every other key is assigned, since a definition costs more
 * than an assignment and callers such as `@rjsf/core`'s error-schema prune write every key of a whole tree, so on an
 * object whose prototype has a setter for the key, or that already holds it as a non-enumerable property, the
 * assignment runs that setter or keeps those attributes.
 *
 * @param obj - The object to write to
 * @param key - The key to write, a path segment's array index included
 * @param value - The value to store at `key`
 */
export default function setOwn(obj: GenericObjectType, key: string | number, value: unknown) {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  } else {
    // oxlint-disable-next-line no-param-reassign
    obj[key] = value;
  }
}
