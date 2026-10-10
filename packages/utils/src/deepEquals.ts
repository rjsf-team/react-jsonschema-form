import { createCustomEqual } from 'fast-equals';
import type { ComparatorConfig } from 'fast-equals';

const comparators: Partial<ComparatorConfig<undefined>> = {
  areFunctionsEqual(_a, b) {
    return typeof b === 'function';
  },
};

/** Implements a deep equals using `fast-equals.createCustomEqual`. Functions
 * are always considered equal, and circular references are tracked to avoid
 * infinite recursion on self-referential inputs.
 *
 * @param a - The first element to compare
 * @param b - The second element to compare
 * @returns - True if the `a` and `b` are deeply equal, false otherwise
 */
const deepEquals = createCustomEqual({
  circular: true,
  createCustomConfig: () => comparators,
});

/** `deepEquals()` for which a key that is missing reads as one holding `undefined`, whichever object lacks it and at
 * any depth
 *
 * @param a - The first element to compare
 * @param b - The second element to compare
 * @returns - True if the `a` and `b` are deeply equal, false otherwise
 */
export const deepEqualsUndefinedAsMissing = createCustomEqual({
  circular: true,
  createCustomConfig: () => ({
    ...comparators,
    areObjectsEqual(a: object, b: object, state) {
      for (const key of Object.keys(a)) {
        const other: unknown = Object.hasOwn(b, key) ? Reflect.get(b, key) : undefined;
        if (!state.equals(Reflect.get(a, key), other, key, key, a, b, state)) {
          return false;
        }
      }
      for (const key of Object.keys(b)) {
        if (Reflect.get(b, key) !== undefined && !Object.hasOwn(a, key)) {
          return false;
        }
      }
      return true;
    },
  }),
});

export default deepEquals;
