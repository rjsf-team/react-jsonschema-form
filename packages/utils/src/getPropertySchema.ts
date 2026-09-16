import { PROPERTIES_KEY } from './constants.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the sub-schema declared for `property` in the `properties` of `schema`, falling back to an empty schema
 * when the schema has no such property. Callers treat the properties of a schema as schemas of the same type `S`,
 * which the `JSONSchema7` typing of `properties` cannot express, so this function owns that single assertion rather
 * than repeating it at every lookup.
 *
 * @param schema - The schema, if any, from which to read the property sub-schema
 * @param property - The name of the property whose sub-schema is desired
 * @returns - The sub-schema for `property`, or an empty schema when it is not declared
 */
export default function getPropertySchema<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S | undefined,
  property: string,
): S {
  return (schema?.[PROPERTIES_KEY]?.[property] ?? {}) as S;
}
