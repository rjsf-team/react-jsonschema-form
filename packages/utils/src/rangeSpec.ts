import toNumericValue from './toNumericValue.ts';
import type { RangeSpecType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Extracts the range spec information `{ step?: number, min?: number, max?: number }` that can be spread onto an HTML
 * input from the range analog in the schema `{ multipleOf?: number, minimum?: number, maximum?: number }`. A numeric
 * string counts as its number, and anything else an input can't show, such as an Ajv `$data` reference, sets nothing.
 *
 * @param schema - The schema from which to extract the range spec
 * @returns - A range specification from the schema
 */
export default function rangeSpec<S extends StrictRJSFSchema = RJSFSchema>(schema: S) {
  const spec: RangeSpecType = {};
  const step = toNumericValue(schema.multipleOf);
  const min = toNumericValue(schema.minimum);
  const max = toNumericValue(schema.maximum);
  if (step) {
    spec.step = step;
  }
  if (min !== undefined) {
    spec.min = min;
  }
  if (max !== undefined) {
    spec.max = max;
  }
  return spec;
}
