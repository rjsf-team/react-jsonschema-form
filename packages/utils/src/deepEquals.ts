import { createCustomEqual } from 'fast-equals';

/** Implements a deep equals using the `fast-equals.createCustomEqual` function, providing a customized comparator that assumes all functions are equivalent.
 *
 * @param a - The first element to compare
 * @param b - The second element to compare
 * @returns - True if the `a` and `b` are deeply equal, false otherwise
 */
const deepEquals = createCustomEqual({
  createCustomConfig: () => ({
    // Assume all functions are equivalent
    // see https://github.com/rjsf-team/react-jsonschema-form/issues/255
    //
    // Performance improvement: knowing that typeof a === function, so, only needs to check if typeof b === function.
    // https://github.com/planttheidea/fast-equals/blob/c633c4e653cacf8fd5cbb309b6841df62322d74c/src/comparator.ts#L99
    areFunctionsEqual(_a, b) {
      return typeof b === 'function';
    },
  }),
});

export default deepEquals;
