import { JSON_SCHEMA_TYPES_NAME } from './constants.ts';
import guessType from './guessType.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the type of a given `schema`. If the type is not explicitly defined, then an attempt is made to infer it from
 * other elements of the schema as follows:
 * - schema.const: Returns the `guessType()` of that value
 * - schema.enum: Returns `string`
 * - schema.properties: Returns `object`
 * - schema.additionalProperties: Returns `object`
 * - schema.patternProperties: Returns `object`
 * - type is an array with a length of 2 and one type is 'null': Returns the other type
 *
 * @param schema - The schema for which to get the type
 * @returns - The type of the schema
 */
export default function getSchemaType<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): string | string[] | undefined {
  const { type } = schema;

  if (!type && schema.const) {
    return guessType(schema.const);
  }

  if (!type && schema.enum) {
    return 'string';
  }

  if (!type && (schema.properties || schema.additionalProperties || schema.patternProperties)) {
    return 'object';
  }

  if (Array.isArray(type)) {
    const filteredTypes = type.filter((t) => JSON_SCHEMA_TYPES_NAME.includes(t));

    if (filteredTypes.length === 1) {
      return type[0];
    }

    if (filteredTypes.length === 2 && filteredTypes.includes('null')) {
      return filteredTypes.find((t) => t !== 'null');
    }

    return filteredTypes;
  }

  return type;
}
