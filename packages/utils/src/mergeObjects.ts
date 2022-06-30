import isObject from './isObject';
import { GenericObjectType } from './types';

/** Recursively merge deeply nested objects.
 *
 * @param obj1 - The first object to merge
 * @param obj2 - The second object to merge
 * @param [concatArrays=false] - Optional flag that, when true, will cause arrays to be concatenated
 * @returns - A new object that is the merge of the two given objects
 */
export default function mergeObjects(obj1: GenericObjectType, obj2: GenericObjectType, concatArrays = false) {
  return Object.keys(obj2).reduce((acc, key) => {
    const left = obj1 ? obj1[key] : {},
      right = obj2[key];
    if (obj1 && key in obj1 && isObject(right)) {
      acc[key] = mergeObjects(left, right, concatArrays);
    } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
      acc[key] = left.concat(right);
    } else {
      acc[key] = right;
    }
    return acc;
  }, Object.assign({}, obj1)); // Prevent mutation of source object.
}
