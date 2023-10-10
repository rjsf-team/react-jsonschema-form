import guessType from './guessType';
import { RJSFSchema, StrictRJSFSchema } from './types';

/** Gets the type of a given `schema`. If the type is not explicitly defined, then an attempt is made to infer it from
 * other elements of the schema as follows:
 * - schema.const: Returns the `guessType()` of that value
 * - schema.enum: Returns `string`
 * - schema.properties: Returns `object`
 * - schema.additionalProperties: Returns `object`
 * - type is an array with a length of 2 and one type is 'null': Returns the other type
 *
 * @param schema - The schema for which to get the type
 * @returns - The type of the schema
 */
export default function getSchemaType<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S
): string | string[] | undefined {
  let { type } = schema;

  if (!type && schema.const) {
    return guessType(schema.const);
  }

  if (!type && schema.enum) {
    return 'string';
  }

  if (!type && (schema.properties || schema.additionalProperties)) {
    return 'object';
  }

  if (Array.isArray(type)) {
    if (type.length === 2 && type.includes('null')) {
      type = type.find((type) => type !== 'null');
    } else {
      type = type[0];
    }
  }

  return type;
}
