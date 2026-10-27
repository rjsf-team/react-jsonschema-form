import isObject from './isObject.ts';
import setOwn from './setOwn.ts';
import type { GenericObjectType } from './types.ts';

/** Recursively merge deeply nested objects.
 *
 * @param obj1 - The first object to merge
 * @param obj2 - The second object to merge
 * @param [concatArrays=false] - Optional flag that, when true, will cause arrays to be concatenated. Use
 *          "preventDuplicates" to merge arrays in a manner that prevents any duplicate entries from being merged.
 *          NOTE: Uses shallow comparison for the duplicate checking.
 * @returns - A new object that is the merge of the two given objects, typed as the `R` the caller declares
 */
export default function mergeObjects<R extends object = GenericObjectType>(
  obj1: object,
  obj2: object,
  concatArrays: boolean | 'preventDuplicates' = false,
): R {
  const result = Object.keys(obj2).reduce(
    (acc, key) => {
      // Only an own member of `obj1` takes part: a JSON-sourced `__proto__` or `constructor` key would otherwise
      // read the inherited member and merge into a copy of `Object.prototype`
      const hasLeft = Object.hasOwn(obj1, key);
      const left: unknown = hasLeft ? Reflect.get(obj1, key) : undefined,
        right: unknown = Reflect.get(obj2, key);
      let merged = right;
      if (hasLeft && isObject(right)) {
        merged = mergeObjects(isObject(left) ? left : {}, right, concatArrays);
      } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
        let toMerge = right;
        if (concatArrays === 'preventDuplicates') {
          toMerge = right.filter((value) => !left.includes(value));
        }
        merged = left.concat(toMerge);
      }
      setOwn(acc, key, merged);
      return acc;
    },
    { ...obj1 },
  ); // Prevent mutation of source object.
  // The single deliberate cast here: the merged object is trusted to be the `R` the caller declared
  return result as R;
}
