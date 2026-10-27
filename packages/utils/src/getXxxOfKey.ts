import { ANY_OF_KEY, ONE_OF_KEY } from './constants.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the keyword whose options are rendered for the `schema`. Only a non-empty array offers options: a keyword
 * left `undefined` by a schema assembled in code, or holding an empty list, describes nothing to choose between, so the
 * schema reads as one without it and is handled through its own type. `anyOf` wins when both keywords offer options.
 * Every reader of the options goes through here so that the select, its labels, its sanitizing, its defaults and the
 * layout grid all agree on the one list that is on screen.
 *
 * @param schema - The schema that may carry an `anyOf` or a `oneOf`
 * @returns - `anyOf` or `oneOf` when that keyword holds a non-empty array, otherwise `undefined`
 */
export default function getXxxOfKey<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): typeof ANY_OF_KEY | typeof ONE_OF_KEY | undefined {
  const anyOf = schema[ANY_OF_KEY];
  if (Array.isArray(anyOf) && anyOf.length > 0) {
    return ANY_OF_KEY;
  }
  const oneOf = schema[ONE_OF_KEY];
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    return ONE_OF_KEY;
  }
  return undefined;
}
