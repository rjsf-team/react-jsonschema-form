import toNumericValue from './toNumericValue.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Drops binary floating point's noise: `2.3 - 1.3` falls just short of 1, which would lose the last star, and
 * `0.57 + 1` misses 1.57, so a stored 1.57 would check no star
 */
const withoutFloatNoise = (number: number) => Number(number.toFixed(9));

/** The values of the stars a rating widget draws, one for each whole number from the schema's `minimum` (0 if it has
 * none) up to its `maximum`, but no more than the `stars` option, or the default 5 for a `stars` that isn't a number,
 * and within 1-5. A numeric string counts as its number, as a JSON schema or uiSchema can hold one
 *
 * @param schema - The schema of the field
 * @param stars - The `stars` option, which a JSON uiSchema can hold as anything
 * @returns - The value of each star to draw, in order
 */
export default function ratingStarValues<S extends StrictRJSFSchema = RJSFSchema>(schema: S, stars: unknown): number[] {
  const minimum = toNumericValue(schema.minimum) ?? 0;
  const maximum = toNumericValue(schema.maximum);
  const span = maximum === undefined ? Infinity : withoutFloatNoise(maximum - minimum + 1);
  const count = Math.floor(Math.max(Math.min(span, toNumericValue(stars) ?? 5, 5), 1));
  return Array.from({ length: count }, (_, index) => withoutFloatNoise(minimum + index));
}
