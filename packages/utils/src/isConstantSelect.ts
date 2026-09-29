import getXxxOfKey from './getXxxOfKey.ts';
import isConstantOptionList from './isConstantOptionList.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Checks whether the value of `schema` is picked from a list of constants, whatever its `type`: an `enum`, or an
 * `anyOf`/`oneOf` of constants read from the keyword `getXxxOfKey()` picks. An `object` or `array` schema that passes
 * is a select for its whole value (see `isWholeValueSelect()`) rather than a container whose contents are edited,
 * pruned or sanitized. An empty list offers no option, so it passes only when `allowEmpty` is set, which is how
 * `isSelect()` checks a schema; an empty `enum` otherwise leaves the `anyOf`/`oneOf` to decide. Unlike `isSelect()`,
 * `schema` is not resolved first.
 *
 * @param schema - The already-resolved schema to check
 * @param [allowEmpty=false] - Whether an empty `enum` or `anyOf`/`oneOf` counts as a select
 * @returns - True if `schema` offers a list of constant values to choose from, which is non-empty unless `allowEmpty`
 *        is set
 */
export default function isConstantSelect<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  allowEmpty = false,
): boolean {
  if (Array.isArray(schema.enum) && (allowEmpty || schema.enum.length > 0)) {
    return true;
  }
  const xxxOfKey = getXxxOfKey<S>(schema);
  return xxxOfKey !== undefined && isConstantOptionList<S>(schema[xxxOfKey], !allowEmpty);
}
