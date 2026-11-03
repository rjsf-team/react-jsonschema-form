import type { StrictRJSFSchema } from './types.ts';

/** Reports whether a widget that draws a number, such as a rating or a slider, writes its value as a string. The
 * schema's type decides, so a change makes invalid data valid, and a type that allows a number too writes one. The
 * value only speaks for a schema with no type
 *
 * @param schema - The schema of the field
 * @param value - The widget's value
 * @returns - True if the widget writes a string
 */
export default function numericWidgetStoresString<S extends StrictRJSFSchema>(schema: S, value: unknown): boolean {
  if (schema.type === undefined) {
    return typeof value === 'string';
  }
  const types = [schema.type].flat();
  return types.includes('string') && !types.includes('number') && !types.includes('integer');
}
