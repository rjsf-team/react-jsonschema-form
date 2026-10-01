import { ITEMS_KEY, PROPERTIES_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import { resolveAnyOrOneOfSchemas, retrieveSchemaInternal } from '../schema/retrieveSchema.ts';
import type { FormContextType, RJSFSchema, SchemaContext, SchemaParserOptions, StrictRJSFSchema } from '../types.ts';
import type { SchemaMap } from './ParserValidator.ts';
import ParserValidator from './ParserValidator.ts';

/** Recursive function used to parse the given `schema` belonging to the `rootSchema`. The context's `ParserValidator` is
 * used to capture the sub-schemas that the `isValid()` function is called with. For each schema returned by the
 * `retrieveSchemaInternal()`, the `resolveAnyOrOneOfSchemas()` function is called. For each of the schemas returned
 * from THAT call have `properties`, then each of the sub-schema property objects are then recursively parsed.
 *
 * @param context - The `SchemaContext` holding the `ParserValidator` that captures `isValid()` calls during parsing
 * @param recurseList - The list of schemas returned from the `retrieveSchemaInternal`, preventing infinite recursion
 * @param rootSchema - The root schema from which the schema parsing began
 * @param schema - The current schema element being parsed
 */
function parseSchema<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  recurseList: S[],
  rootSchema: S,
  schema: S,
) {
  const schemas = retrieveSchemaInternal<T, S, F>(context, schema, rootSchema, undefined, true);
  schemas.forEach((localSchema) => {
    const sameSchemaIndex = recurseList.findIndex((item) => deepEquals(item, localSchema));
    if (sameSchemaIndex === -1) {
      recurseList.push(localSchema);
      const allOptions = resolveAnyOrOneOfSchemas<T, S, F>(context, localSchema, rootSchema, true);
      // Merging an option into the schema can replace one of the schema's own subschemas (a property's `oneOf`, say),
      // so the schema is parsed alongside its options rather than being taken as covered by them
      new Set([localSchema, ...allOptions]).forEach((s) => {
        // A schema with both keywords resolves one at a time, leaving the other on each option to be parsed in turn
        if (s !== localSchema && getXxxOfKey<S>(s)) {
          parseSchema<T, S, F>(context, recurseList, rootSchema, s);
        }
        for (const value of Object.values(s[PROPERTIES_KEY] ?? {})) {
          parseSchema<T, S, F>(context, recurseList, rootSchema, value as S);
        }
        if (ITEMS_KEY in s && !Array.isArray(s.items) && typeof s.items !== 'boolean') {
          parseSchema<T, S, F>(context, recurseList, rootSchema, s.items as S);
        }
      });
    }
  });
}

/** Parses the given `rootSchema` to extract out all the sub-schemas that maybe contained within it. Returns a map of
 * the hash of the schema to schema/sub-schema.
 *
 * @param rootSchema - The root schema to parse for sub-schemas used by `isValid()` calls
 * @param [options={}] - The `SchemaParserOptions` to parse with; pass the same `customMergeAllOf` the form uses, so the
 *        parsed sub-schemas match the ones the form validates against
 * @returns - The `SchemaMap` of all schemas that were parsed
 */
export default function schemaParser<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(rootSchema: S, options: SchemaParserOptions<S> = {}): SchemaMap<S> {
  const validator = new ParserValidator<S, F>(rootSchema);
  const recurseList: S[] = [];

  parseSchema({ ...options, validator }, recurseList, rootSchema, rootSchema);

  return validator.getSchemaMap();
}
