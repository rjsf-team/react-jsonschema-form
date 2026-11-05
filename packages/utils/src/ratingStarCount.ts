import rangeSpec from './rangeSpec.ts';
import toNumericValue from './toNumericValue.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** The number of stars a rating widget draws, one for each whole number from the schema's `minimum` (0 if it reads as
 * none) up to its `maximum`, but no more than the `stars` option, or the default 5 for a `stars` that isn't a number,
 * and within 1-5. A bound or `stars` that reads as a number, a numeric string included, counts as that number
 *
 * @param schema - The schema of the field
 * @param stars - The `stars` option, which a JSON uiSchema can hold as anything
 * @returns - The number of stars to draw
 */
export default function ratingStarCount<S extends StrictRJSFSchema>(schema: S, stars: unknown): number {
  const { min = 0, max } = rangeSpec<S>(schema);
  // Rounded so binary floating point's noise, such as `2.3 - 1.3` falling just short of 1, doesn't lose the last star
  const span = max === undefined ? Infinity : Number((max - min + 1).toFixed(9));
  return Math.floor(Math.max(Math.min(span, toNumericValue(stars) ?? 5, 5), 1));
}
