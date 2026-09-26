import { ANY_OF_KEY, ONE_OF_KEY } from './constants.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the keyword whose options are rendered for the `schema`. `anyOf` wins when a schema carries both keywords,
 * and every reader of the options goes through here so that the select, its labels, its sanitizing and the layout grid
 * all agree on the one list that is on screen.
 *
 * @param schema - The schema that may carry an `anyOf` or a `oneOf`
 * @returns - `anyOf` or `oneOf` when that keyword holds an array, otherwise `undefined`
 */
export default function getXxxOfKey<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): typeof ANY_OF_KEY | typeof ONE_OF_KEY | undefined {
  if (Array.isArray(schema[ANY_OF_KEY])) {
    return ANY_OF_KEY;
  }
  if (Array.isArray(schema[ONE_OF_KEY])) {
    return ONE_OF_KEY;
  }
  return undefined;
}
