import { JSON_SCHEMA_TYPES, UNEVALUATED_PROPERTIES_KEY } from './constants.ts';
import guessType from './guessType.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the type of a given `schema`. If the type is not explicitly defined, then an attempt is made to infer it from
 * other elements of the schema as follows:
 * - schema.const: Returns the `guessType()` of that value
 * - schema.enum: Returns `string`
 * - schema.properties: Returns `object`
 * - schema.additionalProperties: Returns `object`
 * - schema.patternProperties: Returns `object`
 * - schema.unevaluatedProperties: Returns `object`, since it describes the keys an object's other keywords leave over
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

  if (
    !type &&
    (schema.properties ||
      schema.additionalProperties ||
      schema.patternProperties ||
      // A 2019-09 keyword `JSONSchema7` does not declare, read off the schema the way the others are: it describes the
      // keys the other keywords leave unevaluated, which only an object has
      (schema as GenericObjectType)[UNEVALUATED_PROPERTIES_KEY])
  ) {
    return 'object';
  }

  if (Array.isArray(type)) {
    // Searched in place rather than through `getKnownTypes()`, which builds a deduplicated copy of the list on every call
    // of a function every field calls on every render
    return type.find((t) => t !== 'null' && JSON_SCHEMA_TYPES.includes(t)) ?? type.find((t) => t !== 'null') ?? type[0];
  }

  return type;
}
