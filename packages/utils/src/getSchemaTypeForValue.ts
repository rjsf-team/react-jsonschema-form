import getSchemaType from './getSchemaType.ts';
import guessType from './guessType.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the type of a given `schema` that `value` has. A schema whose `type` is a list allows a value of any type it
 * lists, not just the one `getSchemaType()` resolves it to, so a value of another listed type is read as its own type:
 * a string held by a `['null', 'object', 'string']` is a string, not an object to look for properties in. A number
 * held by a list naming `integer` but not `number` is that `integer`. Any other value, and a schema naming a single
 * type, gets what `getSchemaType()` returns. An `undefined` value is no value at all, so it gets that too rather than
 * being taken for the `null` that `guessType()` reports it as.
 *
 * @param schema - The schema describing `value`
 * @param [value] - The value whose type is wanted
 * @returns - The listed type `value` has, otherwise the type of the schema
 */
export default function getSchemaTypeForValue<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  value?: unknown,
): string | undefined {
  const { type } = schema;
  if (Array.isArray(type) && value !== undefined) {
    const valueType = guessType(value);
    if (type.includes(valueType)) {
      return valueType;
    }
    if (valueType === 'number' && type.includes('integer')) {
      return 'integer';
    }
  }
  return getSchemaType<S>(schema);
}
