import { ADDITIONAL_PROPERTIES_KEY, ITEMS_KEY, PATTERN_PROPERTIES_KEY, PROPERTIES_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import isObject from '../isObject.ts';
import { resolveAnyOrOneOfSchemas, retrieveSchemaInternal } from '../schema/retrieveSchema.ts';
import type { FormContextType, RJSFSchema, SchemaContext, SchemaParserOptions, StrictRJSFSchema } from '../types.ts';
import type { SchemaMap } from './ParserValidator.ts';
import ParserValidator from './ParserValidator.ts';

/** The state that one `schemaParser()` call shares across its recursive `parseSchema()` calls
 */
interface ParseState<S extends StrictRJSFSchema = RJSFSchema> {
  /** The schemas returned from the `retrieveSchemaInternal()` so far, preventing infinite recursion */
  readonly recurseList: S[];
  /** The schema objects already parsed, held by identity. A schema resolves to the same thing however it was reached,
   * and an option merged into its parent carries the parent's own property objects, so the same object arrives here once
   * per option; skipping it saves resolving and merging it again for a result the `recurseList` would discard
   */
  readonly parsed: Set<S>;
}

/** Recursive function used to parse the given `schema` belonging to the `rootSchema`. The context's `ParserValidator` is
 * used to capture the sub-schemas that the `isValid()` function is called with. For each schema returned by the
 * `retrieveSchemaInternal()`, the sub-schemas the form renders its value with are parsed, as is each of its
 * `resolveAnyOrOneOfSchemas()` options, since an option can carry sub-schemas of its own.
 *
 * @param context - The `SchemaContext` holding the `ParserValidator` that captures `isValid()` calls during parsing
 * @param state - The `ParseState` shared by every `parseSchema()` call of one `schemaParser()` call
 * @param rootSchema - The root schema from which the schema parsing began
 * @param schema - The current schema element being parsed
 */
function parseSchema<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  state: ParseState<S>,
  rootSchema: S,
  schema: S,
) {
  if (state.parsed.has(schema)) {
    return;
  }
  state.parsed.add(schema);
  const schemas = retrieveSchemaInternal<T, S, F>(context, schema, rootSchema, undefined, true);
  schemas.forEach((localSchema) => {
    const sameSchemaIndex = state.recurseList.findIndex((item) => deepEquals(item, localSchema));
    if (sameSchemaIndex === -1) {
      state.recurseList.push(localSchema);
      parseValueSchemas<T, S, F>(context, state, rootSchema, localSchema);
      // An option can hold an `allOf`, conditions or dependencies of its own, which only parsing the option resolves.
      // The schema is parsed alongside its options rather than being taken as covered by them, since merging an option
      // into the schema can replace one of the schema's own subschemas (a property's `oneOf`, say)
      for (const option of resolveAnyOrOneOfSchemas<T, S, F>(context, localSchema, rootSchema, true)) {
        if (option !== localSchema) {
          parseSchema<T, S, F>(context, state, rootSchema, option);
        }
      }
    }
  });
}

/** Parses the sub-schemas that a form renders the value of `schema` with: the `properties` of an object, the
 * `patternProperties` and `additionalProperties` it renders the keys not named there with, and the `items` of an array,
 * including every position of a tuple `items` and the `additionalItems` rendered beyond it.
 *
 * @param context - The `SchemaContext` holding the `ParserValidator` that captures `isValid()` calls during parsing
 * @param state - The `ParseState` shared by every `parseSchema()` call of one `schemaParser()` call
 * @param rootSchema - The root schema from which the schema parsing began
 * @param schema - The schema whose value sub-schemas are being parsed
 */
function parseValueSchemas<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, state: ParseState<S>, rootSchema: S, schema: S) {
  const valueSchemas: unknown[] = Object.values(schema[PROPERTIES_KEY] ?? {});
  // An additional property is only stubbed into `properties` once the form data has a key for it, which the parse has
  // none of, so the schema a form renders those keys with is reached here instead
  valueSchemas.push(...Object.values(schema[PATTERN_PROPERTIES_KEY] ?? {}), schema[ADDITIONAL_PROPERTIES_KEY]);
  if (Array.isArray(schema.items)) {
    // `additionalItems` only describes the rows a tuple `items` doesn't, and a form renders nothing from it otherwise
    valueSchemas.push(...schema.items, schema.additionalItems);
  } else if (ITEMS_KEY in schema) {
    valueSchemas.push(schema.items);
  }
  for (const valueSchema of valueSchemas) {
    // A boolean or missing sub-schema describes no value of its own, so there is nothing in it to parse
    if (isObject(valueSchema)) {
      parseSchema<T, S, F>(context, state, rootSchema, valueSchema as S);
    }
  }
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

  parseSchema({ ...options, validator }, { recurseList: [], parsed: new Set() }, rootSchema, rootSchema);

  return validator.getSchemaMap();
}
