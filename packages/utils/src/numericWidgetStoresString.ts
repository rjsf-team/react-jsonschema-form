import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Reports whether a widget that draws a number, such as a rating or a slider, writes its value as a string. The
 * schema's type decides, so a change turns a value of the wrong type into a valid one, and a type that allows a number
 * too writes one. A schema with no type has only the value to go by, so it writes a number until it holds a string,
 * even for an `enum` of strings
 *
 * @param schema - The schema of the field
 * @param value - The widget's value
 * @returns - True if the widget writes a string
 */
export default function numericWidgetStoresString<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  value: unknown,
): boolean {
  if (schema.type === undefined) {
    return typeof value === 'string';
  }
  const types = [schema.type].flat();
  return types.includes('string') && !types.includes('number') && !types.includes('integer');
}
