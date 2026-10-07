import { combinationsUpTo } from '../combinationsOf.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  IF_KEY,
  ITEMS_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  THEN_KEY,
} from '../constants.ts';
import { sortedJSONStringify } from '../hashForSchema.ts';
import { isSchemaObject } from '../isObject.ts';
import logOnce from '../logOnce.ts';
import { resolveAnyOrOneOfSchemas, retrieveSchemaInternal } from '../schema/retrieveSchema.ts';
import type { FormContextType, RJSFSchema, SchemaContext, SchemaParserOptions, StrictRJSFSchema } from '../types.ts';
import type { SchemaMap } from './ParserValidator.ts';
import ParserValidator from './ParserValidator.ts';

/** The state that one `schemaParser()` call shares across its recursive `parseSchema()` calls. Both sets hold the
 * `sortedJSONStringify()` of a schema, the string `hashForSchema()` hashes: it compares as `deepEquals()` does, and
 * unlike the hash it cannot collide two schemas into one, which would silently leave a sub-schema out of the
 * compiled map
 */
interface ParseState {
  /** The schemas already passed to `parseSchema()`. A schema resolves to the same thing however it was reached, and an
   * option merged into its parent carries the parent's own sub-schemas, so the same one arrives once per option
   */
  readonly parsed: Set<string>;
  /** The schemas `retrieveSchemaInternal()` has already returned, preventing infinite recursion */
  readonly resolved: Set<string>;
  /** The `patternProperties` whose combinations have been enumerated. An option merged into its parent carries the
   * parent's `patternProperties`, so the same set arrives once per option, and enumerating it again rebuilds and
   * stringifies the same `2^n - 1` combinations for `parsed` to discard
   */
  readonly patterns: Set<string>;
}

/** The most `patternProperties` one schema may have for every combination of them to be enumerated. There are
 * `2^n - 1` of those, so each pattern doubles the work: enumerating this many takes seconds for the smallest
 * sub-schemas a pattern can hold, and longer in proportion to their size, with a few patterns more than this running
 * into minutes. The limit is where the doubling is cut off rather than a point where the work is still cheap
 */
const MAX_COMBINED_PATTERN_PROPERTIES = 16;

/** Returns the combinations of the given `patternProperties` to parse. A form reads only the combination that a form
 * data key actually matches, which a parse that has no form data cannot know, so every one of the `2^n - 1` of them
 * has to be covered. Past `MAX_COMBINED_PATTERN_PROPERTIES` that is more work than a compile can do, so only each
 * pattern on its own and all of them together are returned: a schema with that many patterns is still compiled, and a
 * key matching some other subset of them is the case a precompiled validator will not have a function for.
 *
 * @param patternProperties - The `patternProperties` whose combinations are to be parsed
 * @returns - The list of the combinations of the `patternProperties` sub-schemas to parse
 */
function patternCombinationsOf<V>(patternProperties: Record<string, V>): V[][] {
  const patterns = Object.keys(patternProperties);
  return combinationsUpTo(Object.values(patternProperties), MAX_COMBINED_PATTERN_PROPERTIES, () =>
    // The patterns are named so that a second object over the limit is reported rather than deduped into the first
    // object's warning, which says nothing that tells the two apart
    logOnce(
      `A schema has ${patterns.length} patternProperties, more than the ${MAX_COMBINED_PATTERN_PROPERTIES} whose combinations can all be enumerated, so only each pattern alone and all of them together were parsed. A key can match any subset of them, and a form renders it with the merge of the subset it matches, so a key matching some other subset has no compiled validator. Give the object fewer patternProperties, nesting the values they describe if need be. The patterns are: ${patterns.join(', ')}`,
      'warn',
    ),
  );
}

/** Parses the entries of the `schema`'s `allOf`, and what it declares besides them, alongside the merged schema the
 * caller parses. A form does not validate only against the merge: `getObjectDefaults()` reads a nested object's
 * unmerged `properties`, and `omitExtraData()` reads the entries a merge leaves in place.
 *
 * @param context - The `SchemaContext` holding the `ParserValidator` that captures `isValid()` calls during parsing
 * @param state - The `ParseState` shared by every `parseSchema()` call of one `schemaParser()` call
 * @param rootSchema - The root schema from which the schema parsing began
 * @param schema - The schema whose `allOf`, if it has one, is parsed unmerged
 */
function parseUnmergedAllOf<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, state: ParseState, rootSchema: S, schema: S) {
  const { [ALL_OF_KEY]: allOf, ...withoutAllOf } = schema;
  if (!allOf) {
    return;
  }
  parseSchema<T, S, F>(context, state, rootSchema, withoutAllOf as S);
  for (const subSchema of allOf) {
    if (isSchemaObject<S>(subSchema)) {
      parseSchema<T, S, F>(context, state, rootSchema, subSchema);
    }
  }
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
 * @param [recurseList=[]] - The references resolved on the way to this schema, so that one already on the path stays a
 *        literal rather than being resolved a level further
 */
function parseSchema<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  state: ParseState,
  rootSchema: S,
  schema: S,
  recurseList: string[] = [],
) {
  const parsedKey = sortedJSONStringify(schema);
  if (state.parsed.has(parsedKey)) {
    return;
  }
  state.parsed.add(parsedKey);
  parseUnmergedAllOf<T, S, F>(context, state, rootSchema, schema);
  // `omitExtraData()` applies a schema dependency by walking the dependency's own schema and scoring any `oneOf` it
  // declares, where resolution only ever validates the conditions `withExactlyOneSubschema()` builds out of it
  for (const dependencyValue of Object.values(schema[DEPENDENCIES_KEY] ?? {})) {
    if (isSchemaObject<S>(dependencyValue)) {
      parseSchema<T, S, F>(context, state, rootSchema, dependencyValue);
    }
  }
  // `omitExtraData()` applies the branch an `if` selects by walking the branch's own schema, so a `dependencies` or an
  // `allOf` the branch declares is read there, where resolution only merges the branch into the schema it conditions
  if (IF_KEY in schema) {
    for (const branch of [schema[THEN_KEY], schema[ELSE_KEY]]) {
      if (isSchemaObject<S>(branch)) {
        parseSchema<T, S, F>(context, state, rootSchema, branch);
      }
    }
  }
  // The references resolved on the way to this schema travel with it, so that one already on the path stays a literal
  // rather than being resolved a level further. An option a recursive schema declares is merged into the schema as
  // resolution has left it, which is one level deeper each time, and both `parsed` and `resolved` key by content, so
  // nothing repeats and the descent has nothing to stop it. `retrieveSchemaInternal()` merges what it resolves into
  // the list it is given, so the list comes back holding this schema's references as well as its callers'
  const resolvedRefs = [...recurseList];
  const schemas = retrieveSchemaInternal<T, S, F>(context, schema, rootSchema, undefined, true, resolvedRefs);
  schemas.forEach((localSchema) => {
    const resolvedKey = sortedJSONStringify(localSchema);
    if (!state.resolved.has(resolvedKey)) {
      state.resolved.add(resolvedKey);
      // An `allOf` a merge leaves in place is read unmerged wherever it was reached from, and one that only appears
      // after resolution -- in a `then` or a dependency -- is merged inside `retrieveSchemaInternal()`, so the entries
      // are reached here rather than only on the schema the caller handed in
      parseUnmergedAllOf<T, S, F>(context, state, rootSchema, localSchema);
      parseValueSchemas<T, S, F>(context, state, rootSchema, localSchema, resolvedRefs);
      // An option can hold an `allOf`, conditions or dependencies of its own, which only parsing the option resolves.
      // The schema is parsed alongside its options rather than being taken as covered by them, since merging an option
      // into the schema can replace one of the schema's own subschemas (a property's `oneOf`, say)
      for (const option of resolveAnyOrOneOfSchemas<T, S, F>(context, localSchema, rootSchema, true, undefined, [
        ...resolvedRefs,
      ])) {
        if (option !== localSchema) {
          parseSchema<T, S, F>(context, state, rootSchema, option, resolvedRefs);
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
 * @param recurseList - The references resolved on the way to `schema`, which each of its values is reached through
 */
function parseValueSchemas<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, state: ParseState, rootSchema: S, schema: S, recurseList: string[]) {
  const valueSchemas: unknown[] = Object.values(schema[PROPERTIES_KEY] ?? {});
  // An additional key is only stubbed into `properties` once the form data has one, which a parse does not, so the
  // schema a form renders such a key with is reached here instead
  valueSchemas.push(schema[ADDITIONAL_PROPERTIES_KEY]);
  // A form renders a key its `patternProperties` match with the merge of every pattern matching it, down to the one
  // pattern a lone match makes, so each combination is parsed as the `allOf` that `stubExistingAdditionalProperties()`
  // hands to `retrieveSchema()` rather than as the patterns themselves, which a form resolves nothing from
  const patternProperties = schema[PATTERN_PROPERTIES_KEY];
  if (patternProperties) {
    const patternsKey = sortedJSONStringify(patternProperties);
    if (!state.patterns.has(patternsKey)) {
      state.patterns.add(patternsKey);
      for (const patterns of patternCombinationsOf(patternProperties)) {
        valueSchemas.push({ allOf: patterns });
      }
    }
  }
  if (Array.isArray(schema.items)) {
    // `additionalItems` only describes the rows a tuple `items` doesn't, and a form renders nothing from it otherwise
    valueSchemas.push(...schema.items, schema.additionalItems);
  } else if (ITEMS_KEY in schema) {
    valueSchemas.push(schema.items);
  }
  for (const valueSchema of valueSchemas) {
    if (isSchemaObject<S>(valueSchema)) {
      // A value is reached through the schema that holds it, so it carries the references resolved on the way to that
      // schema -- a recursion through an `items` grows the same way one through a `properties` does. Each value gets
      // its own copy: `resolveAllReferences()` merges what a value resolved back into the list it was given, so a
      // shared one would hold what a sibling resolved and read this value's own reference as a cycle
      parseSchema<T, S, F>(context, state, rootSchema, valueSchema, [...recurseList]);
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

  parseSchema(
    { ...options, validator },
    { parsed: new Set(), resolved: new Set(), patterns: new Set() },
    rootSchema,
    rootSchema,
  );

  return validator.getSchemaMap();
}
