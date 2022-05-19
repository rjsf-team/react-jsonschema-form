import isObject from './isObject';
import { GenericObjectType } from './types';

// Recursively merge deeply nested objects.
export default function mergeObjects(obj1: GenericObjectType, obj2: GenericObjectType, concatArrays = false) {
  return Object.keys(obj2).reduce((acc, key) => {
    const left = obj1 ? obj1[key] : {},
      right = obj2[key];
    if (obj1 && obj1.hasOwnProperty(key) && isObject(right)) {
      acc[key] = mergeObjects(left, right, concatArrays);
    } else if (concatArrays && Array.isArray(left) && Array.isArray(right)) {
      acc[key] = left.concat(right);
    } else {
      acc[key] = right;
    }
    return acc;
  }, Object.assign({}, obj1)); // Prevent mutation of source object.
}
