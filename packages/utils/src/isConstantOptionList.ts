import isConstant from './isConstant.ts';
import isObject from './isObject.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Checks whether `options` is a list of constant schemas, the shape of an `anyOf` or `oneOf` rendered as a select. An
 * empty list passes unless `nonEmpty` is set, since every one of its options is vacuously a constant but it offers
 * nothing to select.
 *
 * @param options - The `anyOf` or `oneOf` list, or anything else
 * @param [nonEmpty=false] - Whether an empty list is rejected
 * @returns - True if `options` is an array whose every entry is a constant schema object, and which has at least one
 *        entry when `nonEmpty` is set
 */
export default function isConstantOptionList<S extends StrictRJSFSchema = RJSFSchema>(
  options: unknown,
  nonEmpty = false,
): options is S[] {
  return (
    Array.isArray(options) &&
    (!nonEmpty || options.length > 0) &&
    options.every((option) => isObject(option) && isConstant(option as S))
  );
}
