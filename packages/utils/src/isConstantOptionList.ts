import isConstant from './isConstant.ts';
import isObject from './isObject.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Checks whether `options` is a list of constant schemas, the shape of an `anyOf` or `oneOf` rendered as a select. An
 * empty list passes, since every one of its options is vacuously a constant; a caller that needs an option to exist
 * checks the length itself.
 *
 * @param options - The `anyOf` or `oneOf` list, or anything else
 * @returns - True if `options` is an array whose every entry is a constant schema object
 */
export default function isConstantOptionList<S extends StrictRJSFSchema = RJSFSchema>(
  options: unknown,
): options is S[] {
  return Array.isArray(options) && options.every((option) => isObject(option) && isConstant(option as S));
}
