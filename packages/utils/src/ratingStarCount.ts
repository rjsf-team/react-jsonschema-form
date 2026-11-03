import toNumericValue from './toNumericValue.ts';
import type { StrictRJSFSchema } from './types.ts';

/** The number of stars a rating widget draws: the schema's `maximum` if it is a number other than 0, otherwise the
 * `stars` option, or the default 5 for a `stars` that isn't a number, limited to 1-5 and rounded down to whole stars.
 * A numeric string counts as its number, as a JSON schema or uiSchema can hold one
 *
 * @param schema - The schema of the field
 * @param stars - The `stars` option, which a JSON uiSchema can hold as anything
 * @returns - The number of stars to draw
 */
export default function ratingStarCount<S extends StrictRJSFSchema>(schema: S, stars: unknown): number {
  const maximum = toNumericValue(schema.maximum);
  const count = maximum === undefined || maximum === 0 ? (toNumericValue(stars) ?? 5) : maximum;
  return Math.floor(Math.min(Math.max(count, 1), 5));
}
