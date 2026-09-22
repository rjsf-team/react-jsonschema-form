import type { JSONSchema7TypeName } from 'json-schema';

import { JSON_SCHEMA_TYPES } from './constants.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

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
  const { type } = schema;
  if (!Array.isArray(type)) {
    return undefined;
  }
  const types = [...new Set(type)].filter((aType) => JSON_SCHEMA_TYPES.includes(aType));
  if (types.filter((aType) => aType !== 'null').length < 2) {
    return undefined;
  }
  return types;
}
