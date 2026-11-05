import { REQUIRED_KEY } from './constants.ts';
import getSchemaType from './getSchemaType.ts';
import isObject from './isObject.ts';
import setOwn from './setOwn.ts';
import type { GenericObjectType } from './types.ts';

/** Recursively merge deeply nested schemas. The difference between `mergeSchemas` and `mergeObjects` is that
 * `mergeSchemas` only concats arrays for values under the 'required' keyword, and when it does, it doesn't include
 * duplicate values.
 *
 * @param obj1 - The first schema object to merge
 * @param obj2 - The second schema object to merge
 * @returns - The merged schema object
 */
export default function mergeSchemas(obj1: object, obj2: object): GenericObjectType {
  const acc: Record<PropertyKey, unknown> = { ...obj1 }; // Prevent mutation of source object.
  // These two are read by key for each key of each merge, where `Reflect.get()` would cost more and throw on a primitive
  // a JS caller passes
  const first = obj1 as GenericObjectType;
  const second = obj2 as Record<PropertyKey, unknown>;
  const result = Object.keys(obj2).reduce((accumulator, key) => {
    // Only an own member of `obj1` takes part, so a JSON-sourced `__proto__` or `toString` key doesn't read an
    // inherited member
    const hasLeft = Object.hasOwn(obj1, key);
    const left = hasLeft ? first[key] : undefined,
      right = second[key];
    if (hasLeft && isObject(right)) {
      setOwn(accumulator, key, mergeSchemas(isObject(left) ? left : {}, right));
    } else if (
      (getSchemaType(obj1) === 'object' || getSchemaType(obj2) === 'object') &&
      key === REQUIRED_KEY &&
      Array.isArray(left) &&
      Array.isArray(right)
    ) {
      // Don't include duplicate values when merging 'required' fields.
      setOwn(accumulator, key, [...new Set([...left, ...right])]);
    } else {
      setOwn(accumulator, key, right);
    }
    return accumulator;
  }, acc);
  // Copy own Symbol-keyed properties from obj2 (Object.keys skips them).
  for (const sym of Object.getOwnPropertySymbols(obj2)) {
    result[sym] = second[sym];
  }
  return result;
}
