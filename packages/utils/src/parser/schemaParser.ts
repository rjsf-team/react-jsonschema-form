import { ID_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import { schemaKey } from '../hashForSchema.ts';
import parseSchemaGraph from '../schema/graph/parseSchemaGraph.ts';
import { validationTargets } from '../schema/graph/validationTargets.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '../types.ts';

/** The type of the map of schema key to schema */
export type SchemaMap<S extends StrictRJSFSchema = RJSFSchema> = Record<string, S>;

/** Returns every schema a form hands its validator for `rootSchema`, keyed by `schemaKey()`, the key a precompiled
 * validator looks its function up by, and carrying that key as its `$id`. The schemas are the root and the ones the
 * schema graph names: a `{ $ref }` for each `if`, option and discriminator property, a copy of an option without its
 * `required` where scoring has to drop one, the condition each `oneOf` option of a `dependencies` schema is matched
 * on, and `{}` where an option is a boolean. They depend on the root alone, never on form data.
 *
 * @param rootSchema - The root schema to list the validated schemas of
 * @returns - The `SchemaMap` of the schemas
 * @throws - Error when two different schemas share a key
 */
export function getValidationSchemas<S extends StrictRJSFSchema = RJSFSchema>(rootSchema: S): SchemaMap<S> {
  const schemaMap: SchemaMap<S> = {};
  for (const schema of validationTargets(parseSchemaGraph<S>(rootSchema))) {
    const key = schemaKey<S>(schema);
    const identified = { ...schema, [ID_KEY]: key };
    const existing = schemaMap[key];
    if (existing !== undefined && !deepEquals(existing, identified)) {
      throw new Error(
        `Two different schemas exist with the same key ${key}! What a bad coincidence. If possible, try adding an $id to one of the schemas`,
      );
    }
    schemaMap[key] = identified;
  }
  return schemaMap;
}

/** Returns `getValidationSchemas(rootSchema)`, the schemas a form hands its validator.
 *
 * @deprecated Use `getValidationSchemas()`, which this returns. Will be removed in v8.
 * @param rootSchema - The root schema to list the validated schemas of
 * @returns - The `SchemaMap` of the schemas
 */
export function schemaParser<S extends StrictRJSFSchema = RJSFSchema, _F extends FormContextType = FormContextType>(
  rootSchema: S,
): SchemaMap<S> {
  return getValidationSchemas<S>(rootSchema);
}
