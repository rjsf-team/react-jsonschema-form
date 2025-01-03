import keys from 'lodash/keys';
import pickBy from 'lodash/pickBy';
import isEqual from 'lodash/isEqual';

/**
 * Compares two objects and returns the names of the fields that have changed.
 * This function iterates over each field of object `a`, using `_.isEqual` to compare the field value
 * with the corresponding field value in object `b`. If the values are different, the field name will
 * be included in the returned array.
 *
 * @param {any} a - The first object, representing the original data to compare.
 * @param {any} b - The second object, representing the updated data to compare.
 * @returns {string[]} - An array of field names that have changed.
 *
 * @example
 * const a = { name: 'John', age: 30 };
 * const b = { name: 'John', age: 31 };
 * const changedFields = getChangedFields(a, b);
 * console.log(changedFields); // Output: ['age']
 */
export default function getChangedFields(a: any, b: any): string[] {
  return keys(pickBy(a, (value, key) => !isEqual(value, b[key])));
}
