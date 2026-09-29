import type { ANY_OF_KEY, ONE_OF_KEY } from './constants.ts';
import getXxxOfKey from './getXxxOfKey.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the `anyOf`/`oneOf` options that are rendered for the `schema`, along with the keyword they are read from,
 * as `getXxxOfKey()` picks it. An empty list offers no option to render, pick defaults from or take a type from, so the
 * schema is handled through its own type instead, the same as one without either keyword.
 *
 * @param schema - The schema that may carry an `anyOf` or a `oneOf`
 * @returns - The keyword and its non-empty list of options, or `undefined` when there is no such list
 */
export default function getXxxOfOptions<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): { key: typeof ANY_OF_KEY | typeof ONE_OF_KEY; options: S[] } | undefined {
  const key = getXxxOfKey<S>(schema);
  const options = key && (schema[key] as S[]);
  return options && options.length > 0 ? { key, options } : undefined;
}
