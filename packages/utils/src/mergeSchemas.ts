import { REQUIRED_KEY } from './constants.ts';
import getSchemaType from './getSchemaType.ts';
import isObject from './isObject.ts';
import setOwn from './setOwn.ts';
import type { GenericObjectType } from './types.ts';

/** Recursively merge deeply nested schemas. The difference between `mergeSchemas` and `mergeObjects` is that
 * `mergeSchemas` only concats arrays for values under the 'required' keyword, and when it does, it doesn't include
 * duplicate values.
 * The result is typed as the caller's `R`, which is an assertion: nothing checks the merged object against it, so a
 * caller names only what it knows the merge holds, as it would with an `as`.
 *
 * @param obj1 - The first schema object to merge
 * @param obj2 - The second schema object to merge
 * @returns - The merged schema object, typed as the `R` the caller declares
 */
export default function mergeSchemas<R extends object = GenericObjectType>(obj1: object, obj2: object): R {
  const acc: GenericObjectType = { ...obj1 }; // Prevent mutation of source object.
  const result = Object.keys(obj2).reduce((accumulator, key) => {
    // Only an own member of `obj1` takes part, so a JSON-sourced `__proto__` or `toString` key doesn't read an
    // inherited member
    const hasLeft = Object.hasOwn(obj1, key);
    const left: unknown = hasLeft ? Reflect.get(obj1, key) : undefined,
      right: unknown = Reflect.get(obj2, key);
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
    Reflect.set(result, sym, Reflect.get(obj2, sym));
  }
  // The single deliberate cast here: the merged object is trusted to be the `R` the caller declared
  return result as R;
}
