import toNumericValue from './toNumericValue.ts';
import type { StrictRJSFSchema } from './types.ts';

/** The number of stars a rating widget draws: the schema's `maximum` if it has one, otherwise the `stars` option, or the
 * default 5 for a `stars` that isn't a number, limited to 1-5 and rounded down to whole stars
 *
 * @param schema - The schema of the field
 * @param stars - The `stars` option, which a JSON uiSchema can hold as anything
 * @returns - The number of stars to draw
 */
export default function ratingStarCount<S extends StrictRJSFSchema>(schema: S, stars: unknown): number {
  const count = schema.maximum ?? toNumericValue(stars) ?? 5;
  return Math.floor(Math.min(Math.max(count, 1), 5));
}
