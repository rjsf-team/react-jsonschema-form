import type { JSONSchema7TypeName } from 'json-schema';

import { JSON_SCHEMA_TYPES } from './constants.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the JSON Schema types a `schema` lists, without the duplicates and the unrecognized names that no field can
 * render. A schema whose `type` is a single name lists nothing, since a name of its own is not a list to choose from.
 *
 * @param schema - The schema for which to get the listed types
 * @returns - The JSON Schema types the `schema` lists, empty when it lists none
 */
export function getKnownTypes<S extends StrictRJSFSchema = RJSFSchema>(schema: S): JSONSchema7TypeName[] {
  const { type } = schema;
  return Array.isArray(type) ? [...new Set(type)].filter((aType) => JSON_SCHEMA_TYPES.includes(aType)) : [];
}

/** Gets the list of types a `schema` allows when it allows more than one of them, i.e. its `type` is an array of two
 * or more non-`null` type names. Unknown type names are dropped since no field can render them. A schema that allows
 * a single type, with or without `null`, is one `getSchemaType()` resolves to that type, so it is not a union and
 * `undefined` is returned for it.
 *
 * @param schema - The schema for which to get the union of types
 * @returns - The types the `schema` allows, or undefined when it does not allow more than one
 */
export default function getUnionTypes<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): JSONSchema7TypeName[] | undefined {
  const types = getKnownTypes<S>(schema);
  if (types.filter((aType) => aType !== 'null').length < 2) {
    return undefined;
  }
  return types;
}
