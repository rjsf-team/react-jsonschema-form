import toNumericValue from './toNumericValue.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** The number of stars a rating widget draws, one for each whole number from the schema's `minimum` (0 if it has none)
 * up to its `maximum`, but no more than the `stars` option, or the default 5 for a `stars` that isn't a number, and
 * within 1-5. A numeric string counts as its number, as a JSON schema or uiSchema can hold one
 *
 * @param schema - The schema of the field
 * @param stars - The `stars` option, which a JSON uiSchema can hold as anything
 * @returns - The number of stars to draw
 */
export default function ratingStarCount<S extends StrictRJSFSchema>(schema: S, stars: unknown): number {
  const minimum = toNumericValue(schema.minimum) ?? 0;
  const maximum = toNumericValue(schema.maximum);
  // Rounded so binary floating point's noise, such as `2.3 - 1.3` falling just short of 1, doesn't lose the last star
  const span = maximum === undefined ? Infinity : Number((maximum - minimum + 1).toFixed(9));
  return Math.floor(Math.max(Math.min(span, toNumericValue(stars) ?? 5, 5), 1));
}
