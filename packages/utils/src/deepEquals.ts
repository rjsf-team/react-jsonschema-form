import { createCustomEqual, State } from 'fast-equals';

/** Check if all parameters are typeof function.
 *
 * @param a - The first element to check typeof
 * @param b - The second element to check typeof
 * @returns - if typeof a and b are equal to function return true, otherwise false
 */
function isFunctions(a: any, b: any) {
  return typeof a === 'function' && typeof b === 'function';
}

/** Implements a deep equals using the `fast-equal.createCustomEqual` function, that provides a customized comparator that
 * assumes all functions in objects are equivalent.
 *
 * @param a - The first element to compare
 * @param b - The second element to compare
 * @returns - True if the `a` and `b` are deeply equal, false otherwise
 */
const customDeepEqual = createCustomEqual({
  createInternalComparator: (comparator: (a: any, b: any, state: State<any>) => boolean) => {
    return (a: any, b: any, _idxA: any, _idxB: any, _parentA: any, _parentB: any, state: State<any>) => {
      if (isFunctions(a, b)) {
        // Assume all functions are equivalent
        // see https://github.com/rjsf-team/react-jsonschema-form/issues/255
        return true;
      }

      return comparator(a, b, state);
    };
  },
});

/** Implements a deep equals using the `fast-equal.createCustomEqual` function, that provides a customized comparator that
 * assumes all functions are equivalent.
 *
 * @param a - The first element to compare
 * @param b - The second element to compare
 * @returns - True if the `a` and `b` are deeply equal, false otherwise
 */
export default function deepEquals(a: any, b: any): boolean {
  if (isFunctions(a, b)) {
    return true;
  }
  return customDeepEqual(a, b);
}
