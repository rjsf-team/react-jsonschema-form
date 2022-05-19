import isEqualWith from 'lodash/isEqualWith';

/** Implements a deep equals using the `lodash.isEqualWith` function, that provides a customized comparator that
 * assumes all functions are equivalent.
 *
 * NOTE: In @rjsf/core < 5.0, this was implemented by a modified copy of the https://github.com/othiym23/node-deeper
 * function, but since we are using elsewhere `lodash`, which has an isEqual that did the same thing, we decided to just
 * customize it for the same use-case thereby maintaining less code.
 *
 * @param a - The first element to compare
 * @param b - The second element to compare
 */
export default function deepEquals(a: any, b: any): boolean {
  return isEqualWith(a, b, (obj: any, other: any) => {
    if (typeof obj === 'function' || typeof other === 'function') {
      // Assume all functions are equivalent
      // see https://github.com/rjsf-team/react-jsonschema-form/issues/255
      return true;
    }
    return undefined; // fallback to default isEquals behavior
  });
}
