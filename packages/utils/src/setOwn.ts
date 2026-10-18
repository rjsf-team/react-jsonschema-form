import type { GenericObjectType } from './types.ts';

/** Writes `value` at `key` of `obj` as an own, enumerable data property. A plain assignment to a JSON-sourced
 * `__proto__` key would reach the prototype setter and re-point `obj`'s prototype instead of adding the key, so that
 * key goes through `Object.defineProperty`.
 *
 * @param obj - The object to write to
 * @param key - The key to write
 * @param value - The value to store at `key`
 */
export default function setOwn(obj: GenericObjectType, key: string, value: unknown) {
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
