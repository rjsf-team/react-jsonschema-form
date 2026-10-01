import { ADDITIONAL_PROPERTIES_KEY, ITEMS_KEY, PATTERN_PROPERTIES_KEY, PROPERTIES_KEY } from '../constants.ts';
import { sortedJSONStringify } from '../hashForSchema.ts';
import isObject from '../isObject.ts';
import { resolveAnyOrOneOfSchemas, retrieveSchemaInternal } from '../schema/retrieveSchema.ts';
import type { FormContextType, RJSFSchema, SchemaContext, SchemaParserOptions, StrictRJSFSchema } from '../types.ts';
import type { SchemaMap } from './ParserValidator.ts';
import ParserValidator from './ParserValidator.ts';

/** The state that one `schemaParser()` call shares across its recursive `parseSchema()` calls. Both sets hold the
 * `sortedJSONStringify()` of a schema, the string `hashForSchema()` hashes: it compares as `deepEquals()` does, in
 * constant time rather than by scanning a list, and unlike the hash it cannot collide two schemas into one, which would
 * silently leave a sub-schema out of the compiled map
 */
interface ParseState {
  /** The schemas already passed to `parseSchema()`. A schema resolves to the same thing however it was reached, and an
   * option merged into its parent carries the parent's own sub-schemas, so the same one arrives once per option
   */
  readonly parsed: Set<string>;
  /** The schemas `retrieveSchemaInternal()` has already returned, preventing infinite recursion */
  readonly resolved: Set<string>;
}

/** Narrows a value read out of a schema -- which the JSON Schema types also allow to be a boolean, and which can be
 * absent -- to the schema `parseSchema()` walks. A boolean or missing sub-schema describes no value of its own.
 *
 * @param valueSchema - The value read out of a schema keyword
 * @returns - True when the value is a schema with content to parse
 */
function isSchemaObject<S extends StrictRJSFSchema = RJSFSchema>(valueSchema: unknown): valueSchema is S {
  return isObject(valueSchema);
}

/** Returns every non-empty combination of the given `values`, each keeping the order they were given in. There are
 * `2^n - 1` of them: a form reads only the combination of `patternProperties` that a form data key actually matches,
 * which a parse that has no form data cannot know, so every one of them has to be covered.
 *
 * @param values - The values to combine
 * @returns - The list of every non-empty combination of the `values`
 */
function combinationsOf<V>(values: V[]): V[][] {
  return values.reduce<V[][]>(
    (combinations, value) => [...combinations, [value], ...combinations.map((combination) => [...combination, value])],
    [],
  );
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
  state: ParseState,
  rootSchema: S,
  schema: S,
) {
  const parsedKey = sortedJSONStringify(schema);
  if (state.parsed.has(parsedKey)) {
    return;
  }
  state.parsed.add(parsedKey);
  const schemas = retrieveSchemaInternal<T, S, F>(context, schema, rootSchema, undefined, true);
  schemas.forEach((localSchema) => {
    const resolvedKey = sortedJSONStringify(localSchema);
    if (!state.resolved.has(resolvedKey)) {
      state.resolved.add(resolvedKey);
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
>(context: SchemaContext<S, F>, state: ParseState, rootSchema: S, schema: S) {
  const valueSchemas: unknown[] = Object.values(schema[PROPERTIES_KEY] ?? {});
  // An additional key is only stubbed into `properties` once the form data has one, which a parse does not, so the
  // schema a form renders such a key with is reached here instead
  valueSchemas.push(schema[ADDITIONAL_PROPERTIES_KEY]);
  // A form renders a key its `patternProperties` match with the merge of every pattern matching it, down to the one
  // pattern a lone match makes, so each combination is parsed as the `allOf` that `stubExistingAdditionalProperties()`
  // hands to `retrieveSchema()` rather than as the patterns themselves, which a form resolves nothing from
  for (const patterns of combinationsOf(Object.values(schema[PATTERN_PROPERTIES_KEY] ?? {}))) {
    valueSchemas.push({ allOf: patterns });
  }
  if (Array.isArray(schema.items)) {
    // `additionalItems` only describes the rows a tuple `items` doesn't, and a form renders nothing from it otherwise
    valueSchemas.push(...schema.items, schema.additionalItems);
  } else if (ITEMS_KEY in schema) {
    valueSchemas.push(schema.items);
  }
  for (const valueSchema of valueSchemas) {
    if (isSchemaObject<S>(valueSchema)) {
      parseSchema<T, S, F>(context, state, rootSchema, valueSchema);
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

  parseSchema({ ...options, validator }, { parsed: new Set(), resolved: new Set() }, rootSchema, rootSchema);

  return validator.getSchemaMap();
}
