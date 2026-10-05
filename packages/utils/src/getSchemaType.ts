import { getKnownTypes } from './getUnionTypes.ts';
import guessType from './guessType.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the type of a given `schema`. If the type is not explicitly defined, then an attempt is made to infer it from
 * other elements of the schema as follows:
 * - schema.const: Returns the `guessType()` of that value
 * - schema.enum: Returns `string`
 * - schema.properties: Returns `object`
 * - schema.additionalProperties: Returns `object`
 * - schema.patternProperties: Returns `object`
 * - type is an array: Returns its first type other than 'null' that JSON Schema defines, since 'null' is the one type
 *   that holds no value to edit and an unrecognized name has no field to render it; failing that its first type other
 *   than 'null', and 'null' for an array listing nothing else
 *
 * @param schema - The schema for which to get the type
 * @returns - The type of the schema
 */
export default function getSchemaType<S extends StrictRJSFSchema = RJSFSchema>(schema: S): string | undefined {
  const { type } = schema;

  if (!type && schema.const !== undefined) {
    return guessType(schema.const);
  }

  if (!type && schema.enum) {
    return 'string';
  }

  if (!type && (schema.properties || schema.additionalProperties || schema.patternProperties)) {
    return 'object';
  }

  if (Array.isArray(type)) {
    return getKnownTypes<S>(schema).find((t) => t !== 'null') ?? type.find((t) => t !== 'null') ?? type[0];
  }

  return type;
}
