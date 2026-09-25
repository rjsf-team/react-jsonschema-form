import { createCustomEqual } from 'fast-equals';

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
  createCustomConfig: () => ({
    areFunctionsEqual(_a, b) {
      return typeof b === 'function';
    },
  }),
});

/** Implements a deep equals that disregards any `undefined`-valued key an object on either side carries, so that
 * `{ a: 1, b: undefined }` and `{ a: 1 }` compare as equal. A key spelling out that it holds nothing says the same
 * thing as an absent key for form data, which is round tripped through JSON and written with explicit `undefined`
 * keys when data is cleared. Like `deepEquals`, functions are always considered equal and circular references are
 * tracked, since `fast-equals` applies its cycle tracking on top of the comparator below
 *
 * @param a - The first element to compare
 * @param b - The second element to compare
 * @returns - True if the `a` and `b` are deeply equal once `undefined`-valued keys are disregarded, false otherwise
 */
export const deepEqualsIgnoringUndefined = createCustomEqual({
  circular: true,
  createCustomConfig: () => ({
    areFunctionsEqual(_a, b) {
      return typeof b === 'function';
    },
    areObjectsEqual(a, b, state) {
      const definedKeys = (value: Record<string, any>) => Object.keys(value).filter((key) => value[key] !== undefined);
      const keysA = definedKeys(a);
      if (keysA.length !== definedKeys(b).length) {
        return false;
      }
      return keysA.every((key) => Object.hasOwn(b, key) && state.equals(a[key], b[key], key, key, a, b, state));
    },
  }),
});

export default deepEquals;
