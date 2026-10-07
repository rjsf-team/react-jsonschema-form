import type { JSONSchema7TypeName } from 'json-schema';

import { GUESSED_TYPE_FLAG, JSON_SCHEMA_TYPES } from './constants.ts';
import getSchemaType from './getSchemaType.ts';
import { getKnownTypes } from './getUnionTypes.ts';
import guessType from './guessType.ts';
import isConstant from './isConstant.ts';
import toConstant from './toConstant.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the JSON Schema types a `schema` says its value has, or `undefined` for one that says nothing about it. A
 * schema listing its types says exactly the recognized ones it lists, even when only one of them is recognized, since
 * the unrecognized names alongside it are what leaves the schema without a field of its own: a `['foo', 'null']` says
 * `null` and nothing more, the way a plain `['null']` is the `null` it names. A schema naming one type says that one.
 * A schema naming no usable type but pinning its value with an `enum` or a `const` says the types those values have,
 * since the value is one of them whichever type is chosen; they are read from the values rather than through
 * `getSchemaType()`, which answers `string` for any typeless `enum` and so would leave out the `number` in an `enum` of
 * numbers. A name the schema does give wins over them, since the values answer for themselves rather than for it.
 * Otherwise `getSchemaType()` answers, so a schema that only implies its type — `properties` implying `object` — says
 * what every other reader of it already renders it as.
 *
 * A schema whose type was guessed from the form data rather than named — an `additionalProperties` entry the schema
 * puts no constraint on — says nothing, since it is the data rather than the schema that named the type, and the value
 * is free to become anything. Neither does one whose only `type` is a name JSON Schema does not define.
 *
 * @param schema - The schema for which to get the types it says its value has
 * @returns - The types the `schema` says its value has, or undefined when it says nothing about it
 */
export default function getSchemaOwnTypes<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): JSONSchema7TypeName[] | undefined {
  const listedTypes = getKnownTypes<S>(schema);
  if (listedTypes.length > 0) {
    return listedTypes;
  }
  if (GUESSED_TYPE_FLAG in schema) {
    return undefined;
  }
  const { type, enum: enumValues } = schema;
  // A type the schema names wins over the values of an `enum` or a `const`, which answer for themselves rather than for
  // the schema: read over a named type they would say `number` for a `{ type: 'integer' }` whose values are whole
  // numbers, since `guessType()` knows no `integer`, and would add the `number` of an `enum: ['a', 1]` to a schema that
  // says `string` — a type the schema rejects, which the fallback UI would then offer and cast the value to
  if (typeof type === 'string' && JSON_SCHEMA_TYPES.includes(type)) {
    return [type];
  }
  // The values of an `enum` or a `const` say what types they have for a schema that names none a field can render: they
  // narrow it to the types it can hold, which is what lets an unrecognized `type` alongside them offer those
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return [...new Set(enumValues.map((value) => guessType(value)))];
  }
  // `undefined` is a legal `const`, so what says the value is pinned is the key being there, which is what
  // `isConstant()` reads and `toConstant()` then answers with
  if (isConstant<S>(schema)) {
    return [guessType(toConstant<S>(schema))];
  }
  const schemaType = getSchemaType<S>(schema);
  // `getSchemaType()` is typed as returning any string, since an unrecognized `type` is returned as it stands
  if (schemaType !== undefined && (JSON_SCHEMA_TYPES as readonly string[]).includes(schemaType)) {
    return [schemaType as JSONSchema7TypeName];
  }
  return undefined;
}
