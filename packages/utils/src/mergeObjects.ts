import isObject from './isObject.ts';
import type { GenericObjectType } from './types.ts';

/** Recursively merge deeply nested objects.
 *
 * @param obj1 - The first object to merge
 * @param obj2 - The second object to merge
 * @param [concatArrays=false] - Optional flag that, when true, will cause arrays to be concatenated. Use
 *          "preventDuplicates" to merge arrays in a manner that prevents any duplicate entries from being merged.
 *          NOTE: Uses shallow comparison for the duplicate checking.
 * @returns - A new object that is the merge of the two given objects
 */
export default function mergeObjects(
  obj1: GenericObjectType,
  obj2: GenericObjectType,
  concatArrays: boolean | 'preventDuplicates' = false,
) {
  return Object.keys(obj2).reduce(
    (acc, key) => {
      // Only an own member of `obj1` takes part: a JSON-sourced `__proto__` or `constructor` key would otherwise
      // read the inherited member and merge into a copy of `Object.prototype`
      const hasLeft = Object.hasOwn(obj1, key);
      const left: unknown = hasLeft ? obj1[key] : undefined,
        right: unknown = obj2[key];
      let merged = right;
      if (hasLeft && isObject(right)) {
        merged = mergeObjects(isObject(left) ? left : {}, right, concatArrays);
      } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
        let toMerge = right;
        if (concatArrays === 'preventDuplicates') {
          toMerge = right.reduce((result, value) => {
            if (!left.includes(value)) {
              result.push(value);
            }
            return result;
          }, []);
        }
        merged = left.concat(toMerge);
      }
      // A plain assignment to `__proto__` would reach the setter and swap the result's prototype for `merged`
      Object.defineProperty(acc, key, { value: merged, enumerable: true, writable: true, configurable: true });
      return acc;
    },
    { ...obj1 },
  ); // Prevent mutation of source object.
}
