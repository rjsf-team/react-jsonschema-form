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

export default deepEquals;
