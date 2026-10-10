import { deepEqualsUndefinedAsMissing } from './deepEquals.ts';
import isPlainObject from './isPlainObject.ts';
import { getByPath } from './pathUtils.ts';
import type { GenericObjectType } from './types.ts';

/** The keys of `object` that hold a value, since a key holding `undefined` reads as one that is missing */
function keysHoldingValue(object: GenericObjectType): string[] {
  return Object.keys(object).filter((key) => object[key] !== undefined);
}

/** Returns the paths of the changed descendants of `a` relative to `b`, relative to the node itself. An empty list
 * means the difference could not be narrowed any further, so the caller should report its own key instead.
 *
 * @param a - The first value, representing the original data to compare
 * @param b - The second value, representing the updated data to compare
 * @returns - An array of dotted paths, relative to `a`
 */
function getChangedDescendants(a: unknown, b: unknown): string[] {
  if (isPlainObject(a) && isPlainObject(b)) {
    return getChangedFields(a, b, true);
  }
  // Arrays of a different length shift their items around, so nothing below them can be matched up by index.
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    const changed: string[] = [];
    // By index, since an empty slot reads as `undefined` and iterating the array itself would skip it
    for (let index = 0; index < a.length; index++) {
      if (!deepEqualsUndefinedAsMissing(a[index], b[index])) {
        const descendants = getChangedDescendants(a[index], b[index]);
        changed.push(...(descendants.length ? descendants.map((path) => `${index}.${path}`) : [String(index)]));
      }
    }
    return changed;
  }
  return [];
}

/**
 * Compares two objects and returns the names of the fields that have changed.
 * This function iterates over each field of object `a`, using `deepEquals` to compare the field value
 * with the corresponding field value in object `b`. If the values are different, the field name will
 * be included in the returned array. A key that is missing reads as one holding `undefined`, whichever object lacks it
 * and at any depth, so a key that only gained or lost an `undefined` value has not changed. So does an empty slot of
 * an array.
 *
 * @param a - The first object, representing the original data to compare.
 * @param b - The second object, representing the updated data to compare.
 * @param [deep=false] - Optional flag that, when true, descends into nested objects and same-length arrays and returns
 *          the dotted path of the deepest field that changed rather than the name of the top-level field holding it.
 * @returns - An array of field names that have changed.
 *
 * @example
 * const a = { name: 'John', age: 30 };
 * const b = { name: 'John', age: 31 };
 * const changedFields = getChangedFields(a, b);
 * console.log(changedFields); // Output: ['age']
 *
 * @example
 * const a = { items: [{ qux: '', corge: '' }] };
 * const b = { items: [{ qux: 'a', corge: '' }] };
 * console.log(getChangedFields(a, b)); // Output: ['items']
 * console.log(getChangedFields(a, b, true)); // Output: ['items.0.qux']
 */
export default function getChangedFields(a: unknown, b: unknown, deep = false): string[] {
  if (a === b) {
    return [];
  }
  // If only one of them is a plainObject all of its fields changed; if neither is, nothing did
  if (!isPlainObject(a)) {
    return isPlainObject(b) ? keysHoldingValue(b) : [];
  }
  if (!isPlainObject(b)) {
    return keysHoldingValue(a);
  }
  const aKeys = Object.keys(a);
  const aKeySet = new Set(aKeys);
  const unequalFields = aKeys
    .filter((key) => !deepEqualsUndefinedAsMissing(a[key], getByPath(b, key)))
    .flatMap((key) => {
      if (!deep) {
        return [key];
      }
      // A key holding a `.` or a `[` is descended into like any other. The path it produces cannot be told apart from
      // a path through nested keys, but neither can the entry an `ErrorSchema` keeps for it, since `toErrorSchema()`
      // spells such a name out as a path in the same way, so the two agree on where the field lives.
      const descendants = getChangedDescendants(a[key], getByPath(b, key));
      return descendants.length ? descendants.map((path) => `${key}.${path}`) : [key];
    });
  const diffFields = keysHoldingValue(b).filter((key) => !aKeySet.has(key));
  return [...unequalFields, ...diffFields];
}
