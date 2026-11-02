import type { RangeSpecType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether a keyword holds a number an input can show, which an Ajv `$data` reference to another value doesn't */
function isBound(keyword: unknown): keyword is number {
  return typeof keyword === 'number' && Number.isFinite(keyword);
}

/** Extracts the range spec information `{ step?: number, min?: number, max?: number }` that can be spread onto an HTML
 * input from the range analog in the schema `{ multipleOf?: number, minimum?: number, maximum?: number }`.
 *
 * @param schema - The schema from which to extract the range spec
 * @returns - A range specification from the schema
 */
export default function rangeSpec<S extends StrictRJSFSchema = RJSFSchema>(schema: S) {
  const spec: RangeSpecType = {};
  if (isBound(schema.multipleOf) && schema.multipleOf !== 0) {
    spec.step = schema.multipleOf;
  }
  if (isBound(schema.minimum)) {
    spec.min = schema.minimum;
  }
  if (isBound(schema.maximum)) {
    spec.max = schema.maximum;
  }
  return spec;
}
