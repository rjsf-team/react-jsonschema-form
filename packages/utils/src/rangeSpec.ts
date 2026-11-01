import type { RangeSpecType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Extracts the range spec information `{ step?: number, min?: number, max?: number }` that can be spread onto an HTML
 * input from the range analog in the schema `{ multipleOf?: number, minimum?: number, maximum?: number }`.
 *
 * @param schema - The schema from which to extract the range spec
 * @returns - A range specification from the schema
 */
export default function rangeSpec<S extends StrictRJSFSchema = RJSFSchema>(schema: S) {
  const spec: RangeSpecType = {};
  // The `typeof` checks are for Ajv's `$data`, whose reference names another value that an input can't show as its bound
  if (typeof schema.multipleOf === 'number' && schema.multipleOf !== 0) {
    spec.step = schema.multipleOf;
  }
  if (typeof schema.minimum === 'number') {
    spec.min = schema.minimum;
  }
  if (typeof schema.maximum === 'number') {
    spec.max = schema.maximum;
  }
  return spec;
}
