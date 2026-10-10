import {
  additionalPropertiesKeyword,
  allowsAdditionalProperties,
  getAdditionalPropertySchema,
  getMatchingPatternProperties,
} from '../additionalPropertiesUtils.ts';
import { combinationsUpTo } from '../combinationsOf.ts';
import {
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  GUESSED_TYPE_FLAG,
  ID_KEY,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  RJSF_REF_CYCLE_KEY,
  RJSF_REF_KEY,
  THEN_KEY,
} from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import findSchemaDefinition, { splitKeyElementFromObject } from '../findSchemaDefinition.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getSchemaOwnTypes from '../getSchemaOwnTypes.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import guessType from '../guessType.ts';
import isObject from '../isObject.ts';
import logOnce from '../logOnce.ts';
import mergeSchemas from '../mergeSchemas.ts';
import { getByPath } from '../pathUtils.ts';
import { declaredRef, resolvedFromRef } from '../refOf.ts';
import type {
  FormContextType,
  GenericObjectType,
  RJSFMarkedSchema,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
} from '../types.ts';
import getFirstMatchingOption, { withVariantId } from './getFirstMatchingOption.ts';
import shallowAllOfMerge from './shallowAllOfMerge.ts';

// Backstop for the resolveReference <-> retrieveSchemaInternal loop: with the path reconstructed from RJSF_REF_KEY
// markers a pass over an already-resolved schema is a no-op, so a resolution that still changes after this many
// passes over a single schema is not terminating; it collapses to the schema resolved so far, flagged as a cycle,
// instead of overflowing the stack. The count is local to one fixpoint loop: nested allOf, then/else and
// dependencies branches receive only the caller's re-walk status, so nesting depth alone cannot reach this limit.
const MAX_RESOLUTION_PASSES = 100;

// Marks the `allOf` that a key's `patternProperties` merge is left undone in, so the level that resolves its way back
// here recognises its own work. `RJSF_REF_CYCLE_KEY` cannot say it: `resolveAllReferences()` sets that one on any
// property whose `$ref` closes a cycle, and such a property travels with the marker through the expansion of that
// `$ref`, so reading it here as a merge already made drops the patterns a key of a mutually recursive schema matches.
// It stays private to this module, since the merge it describes is left and taken up in this one function.
const PATTERN_MERGE_LEFT_UNDONE = Symbol('__rjsf_pattern_merge_left_undone');

/** Retrieves an expanded schema that has had all of its conditions, additional properties, references and dependencies
 * resolved and merged into the `schema` given a `context`, `rootSchema` and `rawFormData` that is used to do the
 * potentially recursive resolution.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param [rootSchema={}] - The root schema that will be forwarded to all the APIs
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema
 * @param [resolveAnyOfOrOneOfRefs = false] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @returns - The schema having its conditions, additional properties, references and dependencies resolved
 */
export default function retrieveSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S = {} as S,
  rawFormData?: T,
  resolveAnyOfOrOneOfRefs = false,
): S {
  return retrieveSchemaInternal<T, S, F>(
    context,
    schema,
    rootSchema,
    rawFormData,
    undefined,
    undefined,
    resolveAnyOfOrOneOfRefs,
  )[0];
}

/** Converts boolean schemas to equivalent object schemas for APIs that operate on `StrictRJSFSchema` objects.
 *
 * @param schema - The schema or boolean schema to normalize
 * @returns - The original schema or an equivalent object schema
 */
function normalizeBooleanSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S | boolean): S {
  if (typeof schema !== 'boolean') {
    return schema;
  }
  return (schema ? {} : { not: {} }) as S;
}

/** Resolves a conditional block (if/else/then) by removing the condition and merging the appropriate conditional branch
 * with the rest of the schema. If `expandAllBranches` is true, then the `retrieveSchemaInteral()` results for both
 * conditions will be returned.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a condition is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and
 *          dependencies as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData to assist retrieving a schema
 * @param [preserveDependencies=false] - Leave dependencies unresolved for default computation
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - A list of schemas with the appropriate conditions resolved, possibly with all branches expanded
 */
export function resolveCondition<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  preserveDependencies = false,
  passCount = 0,
): S[] {
  const { if: expression, then, else: otherwise, ...resolvedSchemaLessConditional } = schema;

  // `null` is checked as `{}` like `undefined`: object keywords such as `required` ignore non-objects, so a `null`
  // would satisfy `if: { required: ['a'] }` and take `then` for an object with no data
  const conditionValue = context.validator.isValid(expression as S, formData ?? {}, rootSchema);
  let resolvedSchemas = [resolvedSchemaLessConditional as S];
  let schemas: S[] = [];
  if (expandAllBranches) {
    if (then && typeof then !== 'boolean') {
      const thenSchema = then as unknown as S;
      schemas = schemas.concat(
        retrieveSchemaInternal<T, S, F>(
          context,
          thenSchema,
          rootSchema,
          formData,
          expandAllBranches,
          enclosingRefPath(schema, recurseList, passCount),
          undefined,
          preserveDependencies,
          passCount > 0 ? 1 : 0,
        ),
      );
    }
    if (otherwise && typeof otherwise !== 'boolean') {
      const otherwiseSchema = otherwise as unknown as S;
      schemas = schemas.concat(
        retrieveSchemaInternal<T, S, F>(
          context,
          otherwiseSchema,
          rootSchema,
          formData,
          expandAllBranches,
          enclosingRefPath(schema, recurseList, passCount),
          undefined,
          preserveDependencies,
          passCount > 0 ? 1 : 0,
        ),
      );
    }
  } else {
    const conditionalBranch = (conditionValue ? then : otherwise) as S | boolean | undefined;
    if (conditionalBranch !== undefined) {
      const conditionalSchema = normalizeBooleanSchema<S>(conditionalBranch);
      schemas = schemas.concat(
        retrieveSchemaInternal<T, S, F>(
          context,
          conditionalSchema,
          rootSchema,
          formData,
          expandAllBranches,
          enclosingRefPath(schema, recurseList, passCount),
          undefined,
          preserveDependencies,
          passCount > 0 ? 1 : 0,
        ),
      );
    }
  }
  if (schemas.length) {
    resolvedSchemas = schemas.map((s) => mergeSchemas(resolvedSchemaLessConditional, s) as S);
  }
  // As with `dependencies`, the merged result is re-walked as a follow-up pass so refs that were already expanded
  // keep their fixpoint depth and a $ref already flagged as a cycle stays collapsed.
  return resolvedSchemas.flatMap((s) =>
    retrieveSchemaInternal<T, S, F>(
      context,
      s,
      rootSchema,
      formData,
      expandAllBranches,
      recurseList,
      undefined,
      preserveDependencies,
      passCount + 1,
    ),
  );
}

/** Given a list of lists of allOf, anyOf or oneOf values, create a list of lists of all permutations of the values. The
 * `listOfLists` is expected to be all resolved values of the 1st...nth schemas within an `allOf`, `anyOf` or `oneOf`.
 * From those lists, build a matrix for each `xxxOf` where there is more than one schema for a row in the list of lists.
 *
 * For example:
 * - If there are three xxxOf rows (A, B, C) and they have been resolved such that there is only one A, two B and three
 *   C schemas then:
 *   - The permutation for the first row is `[[A]]`
 *   - The permutations for the second row are `[[A,B1], [A,B2]]`
 *   - The permutations for the third row are `[[A,B1,C1], [A,B1,C2], [A,B1,C3], [A,B2,C1], [A,B2,C2], [A,B2,C3]]`
 *
 * @param listOfLists - The list of lists of elements that represent the allOf, anyOf or oneOf resolved values in order
 * @returns - The list of all permutations of schemas for a set of `xxxOf`s
 */
export function getAllPermutationsOfXxxOf<S extends StrictRJSFSchema = RJSFSchema>(listOfLists: S[][]) {
  const allPermutations: S[][] = listOfLists.reduce<S[][]>(
    (permutations, list) => {
      // When there are more than one set of schemas for a row, duplicate the set of permutations and add in the values
      if (list.length > 1) {
        return list.flatMap((element) => permutations.map((permutation) => [...permutation, element]));
      }
      // Otherwise just push in the single value into the current set of permutations
      permutations.forEach((permutation) => permutation.push(list[0]));
      return permutations;
    },
    [[]], // Start with an empty list
  );

  return allPermutations;
}

/** Returns the type an additional property described by `subSchema` holds, or `undefined` for a schema that leaves the
 * type to the value the property comes to hold. It is what `retrieveSchema()` stubs such a property with and what
 * `ObjectField` seeds a new one from, so the value the add button writes is one the field it renders can show.
 *
 * The types come from `getSchemaOwnTypes()`, so a schema that names its type says that one, a nullable `['integer',
 * 'null']` resolves to the type a value of it can have, a typeless `enum` takes the type of its values — where
 * `getSchemaType()` answers `string` for any of them, giving an `enum` of numbers a string it rejects — and a schema
 * that only implies its type, `properties` implying `object`, says what every other reader of it renders it as. The
 * non-`null` type comes first, as it does for a nullable type: a value of it is one the field can show, where `null`
 * leaves the user nothing to enter.
 *
 * An `anyOf`/`oneOf` of options that agree on a type has that type whichever option is chosen, each option read by
 * this same function so that an option's own typeless `enum` speaks for it too. Options that disagree, or that name no
 * type between them, say nothing here: choosing one is what would settle it, and a type one of them names alone would
 * render a field for that type beside the options.
 *
 * A schema that says nothing about the type itself is read through the subschemas merged into it — the `allOf` entries
 * it is composed of and the `$ref` it is spelled as, given a `rootSchema` to look the definition up in — since
 * composition is how a schema usually names the object or the enum it is. The options are no exception: one of them
 * naming a type is the option's answer, where a merged subschema's is the whole schema's, so a subschema whose options
 * say nothing is still read through the `allOf` and the `$ref` beside them. The first of those to name a type answers,
 * the merge holding the value to every entry at once. They are looked up rather than the schema resolved: the type is all
 * that is wanted here, where resolving every option of every additional property would cost each render the merges
 * `MultiSchemaField` already pays for the one option on screen. A reference followed once on a walk is not followed
 * again, since a recursive option refers back to itself without end, and one naming no definition says nothing, as the
 * option holding it does until it is resolved.
 *
 * @param subSchema - The schema describing the additional property, from `additionalProperties`, a matching pattern or
 *          `unevaluatedProperties`
 * @param [rootSchema] - The root schema a `$ref` names a definition of, when there is one to look it up in
 * @returns - The type the `subSchema` says the property holds, or undefined when only its value can say
 */
export function getAdditionalPropertyType<S extends StrictRJSFSchema = RJSFSchema>(
  subSchema: S,
  rootSchema?: S,
): string | undefined {
  return additionalPropertyType<S>(subSchema, rootSchema, new Set<string>());
}

/** Returns the definition a `schema` is spelled as a `$ref` to, as far as one can be named without resolving the
 * schema. It is how a subschema says what it is without saying it in keywords of its own, and the lookup is what lets a
 * reader that only asks a question about the subschema -- what type it holds, what names it declares -- ask it of the
 * schema the reference names.
 *
 * Only the keywords the referring schema leaves to it are read off the definition. `resolveAllReferences()` resolves a
 * reference as `{ ...definition, ...schema }`, so a keyword the referring schema declares itself replaces the
 * definition's rather than joining it: the shadowed one describes nothing the form renders, so counting the names it
 * declares would leave a key with no field at all, and putting a shadowed `if` to the validator would ask it about a
 * condition nothing that resolves the schema ever asks -- which a precompiled validator has no function for.
 *
 * @param schema - The schema whose reference is to be looked up
 * @param rootSchema - The root schema the reference names a definition of, when there is one to look it up in
 * @param followedRefs - The references already followed on this walk, which this one is added to
 * @returns - The definition the reference names, less the keywords the referring schema shadows, or undefined where
 *          there is none to name or it was followed already
 */
function referencedDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S | undefined,
  followedRefs: Set<string>,
): S | undefined {
  const $ref = declaredRef<S>(schema);
  if (rootSchema === undefined || $ref === undefined || followedRefs.has($ref)) {
    return undefined;
  }
  followedRefs.add($ref);
  let definition: unknown;
  try {
    definition = findSchemaDefinition<S>($ref, rootSchema);
  } catch {
    // A reference that names no definition says nothing about the property, as the subschema holding it does until it
    // is resolved: whatever resolves that subschema to render it reports the broken reference on its own
    return undefined;
  }
  if (!isObject(definition)) {
    return undefined;
  }
  const unshadowed = { ...definition };
  for (const keyword of Object.keys(schema)) {
    if (keyword !== REF_KEY) {
      delete unshadowed[keyword];
    }
  }
  return unshadowed as S;
}

/** Reads the type for `getAdditionalPropertyType()`, carrying the references followed so far across the options and the
 * definitions the walk reaches.
 *
 * @param subSchema - The schema describing the additional property
 * @param rootSchema - The root schema a `$ref` names a definition of, when there is one to look it up in
 * @param followedRefs - The references already followed on this walk
 * @returns - The type the `subSchema` says the property holds, or undefined when only its value can say
 */
function additionalPropertyType<S extends StrictRJSFSchema = RJSFSchema>(
  subSchema: S,
  rootSchema: S | undefined,
  followedRefs: Set<string>,
): string | undefined {
  const ownTypes = getSchemaOwnTypes<S>(subSchema);
  if (ownTypes) {
    return ownTypes.find((ownType) => ownType !== 'null') ?? ownTypes[0];
  }
  const xxxOf = getXxxOfOptions<S>(subSchema);
  if (xxxOf) {
    // Each option follows the references this walk has followed without adding to the others' lists, so two options
    // naming the same definition both read it rather than the second one reading a reference already followed
    const optionTypes = new Set(
      xxxOf.options.map((option) =>
        isObject(option) ? additionalPropertyType<S>(option, rootSchema, new Set(followedRefs)) : undefined,
      ),
    );
    const [onlyType] = optionTypes;
    if (optionTypes.size === 1 && onlyType !== undefined) {
      return onlyType;
    }
    // Options that say nothing between them leave the question to the subschemas merged in beside them, which
    // constrain the value whichever option is chosen, rather than answering `undefined` for the whole subschema
  }
  // The subschemas merged into this one say what the property holds as much as its own keywords do: an `allOf` entry
  // constrains the very same value, and a `$ref` is how a subschema usually names the object or the enum it is. The
  // first of them to name a type answers, since the merge holds the value to every one of them at once, so a type one
  // entry names is the type the whole merge has whatever the entries that name none add to it
  const merged: (S | boolean | undefined)[] = Array.isArray(subSchema[ALL_OF_KEY])
    ? [...(subSchema[ALL_OF_KEY] as (S | boolean)[])]
    : [];
  // The references followed to reach this subschema, which each entry then follows without adding to the lists of the
  // entries beside it, as an option does: two entries naming the same definition both read it, where one that shadows
  // the definition's `type` would otherwise leave the type behind it unread
  const refs = new Set(followedRefs);
  merged.push(referencedDefinition<S>(subSchema, rootSchema, refs));
  for (const entry of merged.filter((candidate) => isObject(candidate))) {
    const mergedType = additionalPropertyType<S>(entry, rootSchema, new Set(refs));
    if (mergedType !== undefined) {
      return mergedType;
    }
  }
  return undefined;
}

/** Resolves references and dependencies within a schema and its 'allOf' children. Passes the `expandAllBranches` flag
 * down to the `retrieveSchemaInternal()`, `resolveReference()` and `resolveDependencies()` helper calls. If
 * `expandAllBranches` is true, then all possible dependencies and/or allOf branches are returned.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [resolveAnyOfOrOneOfRefs] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @param [preserveDependencies=false] - Leave dependencies unresolved for default computation
 * @param [passCount=0] - Internal backstop counting the passes of the resolveReference fixpoint loop; resolution
 *          collapses to the schema resolved so far, flagged as a cycle, if it does not converge
 * @returns - The list of schemas having its references, dependencies and allOf schemas resolved
 */
export function resolveSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  resolveAnyOfOrOneOfRefs?: boolean,
  preserveDependencies = false,
  passCount = 0,
): S[] {
  const updatedSchemas = resolveReference<T, S, F>(
    context,
    schema,
    rootSchema,
    expandAllBranches,
    recurseList,
    formData,
    resolveAnyOfOrOneOfRefs,
    preserveDependencies,
    passCount,
  );
  if (updatedSchemas.length > 1 || updatedSchemas[0] !== schema) {
    // return the updatedSchemas array if it has either multiple schemas within it
    // OR the first schema is not the same as the original schema
    return updatedSchemas;
  }
  if (DEPENDENCIES_KEY in schema && !preserveDependencies) {
    const resolvedSchemas = resolveDependencies<T, S, F>(
      context,
      schema,
      rootSchema,
      expandAllBranches,
      recurseList,
      formData,
      passCount,
    );
    // The merged result is re-walked so refs introduced by the merge are resolved too. The re-walk runs as a
    // follow-up pass (passCount + 1), so refs that were already expanded keep their fixpoint depth and a $ref
    // already flagged as a cycle stays collapsed.
    return resolvedSchemas.flatMap((s) =>
      retrieveSchemaInternal<T, S, F>(
        context,
        s,
        rootSchema,
        formData,
        expandAllBranches,
        recurseList,
        undefined,
        undefined,
        passCount + 1,
      ),
    );
  }
  if (ALL_OF_KEY in schema && Array.isArray(schema[ALL_OF_KEY])) {
    const allOfSchemaElements: S[][] = schema.allOf.map((allOfSubschema) =>
      retrieveSchemaInternal<T, S, F>(
        context,
        allOfSubschema as S,
        rootSchema,
        formData,
        expandAllBranches,
        enclosingRefPath(schema, recurseList, passCount),
        undefined,
        preserveDependencies,
        passCount > 0 ? 1 : 0,
      ),
    );
    const allPermutations = getAllPermutationsOfXxxOf<S>(allOfSchemaElements);
    return allPermutations.map((permutation) => ({
      ...schema,
      allOf: permutation,
    }));
  }
  // No $ref or dependencies or allOf attribute was found, returning the original schema.
  return [schema];
}

/** Resolves all references within a schema and then returns the `retrieveSchemaInternal()` if the resolved schema is
 * actually different than the original. Passes the `expandAllBranches` flag down to the `retrieveSchemaInternal()`
 * helper call.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a reference is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of $refs already expanded on the current resolution path, used to detect cycles
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [resolveAnyOfOrOneOfRefs] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @param [preserveDependencies=false] - Leave dependencies unresolved for default computation
 * @param [passCount=0] - Internal backstop counting the passes of the fixpoint loop; resolution collapses to the
 *          schema resolved so far, flagged as a cycle, if it does not converge
 * @returns - The list schemas retrieved after having all references resolved
 */
export function resolveReference<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  resolveAnyOfOrOneOfRefs?: boolean,
  preserveDependencies = false,
  passCount = 0,
): S[] {
  if (passCount > MAX_RESOLUTION_PASSES) {
    // Backstop: termination is structural (see below), so reaching this many passes means a regression broke the
    // fixpoint. Collapse to the schema resolved so far, flagged as a cycle, instead of throwing during render:
    // `SchemaField` renders a cycle indicator for it, the way it does for other detected cycles.
    return [{ ...schema, [RJSF_REF_CYCLE_KEY]: true }];
  }
  // Termination of the resolveReference -> retrieveSchemaInternal loop is structural: every expanded $ref leaves
  // its source ref on the materialized subtree as RJSF_REF_KEY, and on a follow-up pass (passCount > 0) that
  // marker goes back on the path - in resolveAllReferences for the subtree walk, and via `enclosingRefPath` for
  // the allOf, then/else and dependencies branch resolutions - so a ref already expanded on the current path is
  // never expanded twice, the re-walk makes no changes, and the loop ends as soon as a pass makes no more
  // changes. `passCount` is only a backstop that collapses the resolution if a regression ever breaks that
  // structure.
  const expandedRefs: string[] = [];
  const updatedSchema = resolveAllReferences<S>(
    schema,
    rootSchema,
    recurseList,
    undefined,
    resolveAnyOfOrOneOfRefs,
    false,
    expandedRefs,
    passCount,
  );
  if (updatedSchema !== schema) {
    // Only call this if the schema was actually changed by the `resolveAllReferences()` function
    return retrieveSchemaInternal<T, S, F>(
      context,
      updatedSchema,
      rootSchema,
      formData,
      expandAllBranches,
      recurseList,
      resolveAnyOfOrOneOfRefs,
      preserveDependencies,
      passCount + 1,
    );
  }
  return [schema];
}

/** Resolves all references within the schema itself as well as any of its properties and array items.
 *
 * @param schema - The schema for which resolving all references is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param recurseList - List of $refs already expanded on the current resolution path, used to detect cycles
 * @param [baseURI] - The base URI to be used for resolving relative references
 * @param [resolveAnyOfOrOneOfRefs] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @param [markCycleOnDetection=false] - When true and a recursive $ref is detected, the returned schema is tagged
 *   with `__rjsf_ref_cycle: true` so that `SchemaField` can render a cycle indicator instead of recursing.
 *   Should only be `true` when called from an **object-property** context, because object properties are always
 *   rendered (creating an infinite render loop), whereas array items and anyOf/oneOf branches are data-driven. It
 *   stays false in resolveAnyOfOrOneOfRefs mode because there a $ref already expanded by an earlier option is
 *   deliberately collapsed to the unexpanded skeleton via `optionsPath` (which keeps shared-ref DAGs linear), and
 *   marking those collapsed skeletons would render false cycle indicators.
 * @param [expandedRefs] - Walk-local collector of the refs materialized during this walk; used to keep later
 *   anyOf/oneOf options that reuse an already-expanded ref collapsed. Pass nothing to get the default behavior.
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this walk belongs to; re-walks
 *   (pass > 0) put materialized refs back on the path so they stay at their fixpoint depth. Callers should omit
 *   this.
 * @returns - given schema will all references resolved or the original schema if no internal `$refs` were resolved
 */
export function resolveAllReferences<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S,
  recurseList: string[],
  baseURI?: string,
  resolveAnyOfOrOneOfRefs?: boolean,
  markCycleOnDetection = false,
  expandedRefs?: string[],
  passCount = 0,
): S {
  if (!isObject(schema)) {
    return schema;
  }
  let resolvedSchema: S = schema;
  let currentBaseURI = baseURI;
  // The recurse list is a path stack: entries are added only for the refs being expanded on the current resolution
  // path and are never shared with sibling subtrees or back with the caller. A $ref is a cycle only when it already
  // appears on the current path.
  let pathList = recurseList;
  // resolve top level ref
  if (REF_KEY in resolvedSchema) {
    const { $ref, ...localSchema } = resolvedSchema;
    // Check for a recursive reference and stop the loop. On a re-walk (passCount > 0), a schema whose
    // RJSF_REF_KEY marker equals its $ref was materialized from that ref by an earlier pass and had the
    // collapsed $ref merged back onto it (e.g. by a dependencies or if/then merge): expanding it again would
    // repeat the earlier pass forever, so it stays collapsed too.
    if (
      pathList.includes($ref!) ||
      (passCount > 0 && (resolvedSchema as Record<symbol, unknown>)[RJSF_REF_KEY] === $ref)
    ) {
      return markCycleOnDetection ? { ...resolvedSchema, [RJSF_REF_CYCLE_KEY]: true } : resolvedSchema;
    }
    pathList = [...pathList, $ref!];
    // Retrieve the referenced schema definition.
    const refSchema = findSchemaDefinition<S>($ref, rootSchema, currentBaseURI);
    resolvedSchema = { ...refSchema, ...localSchema, [RJSF_REF_KEY]: $ref };
    if (ID_KEY in resolvedSchema) {
      currentBaseURI = resolvedSchema[ID_KEY];
    }
    expandedRefs?.push($ref!);
  } else if (passCount > 0) {
    // Only on fixpoint re-walks (pass > 0): a subtree materialized by a previous pass still carries its source
    // $ref as RJSF_REF_KEY, and putting it back on the path keeps refs inside the subtree at their fixpoint
    // depth, so the follow-up pass is a no-op. The first pass of a fresh resolution deliberately does NOT do
    // this: a $ref flagged as a cycle by an earlier call is expanded one more level, which is what lets
    // `CyclicSchemaField` reveal the next level of a cycle. The marker joins `expandedRefs` at most once per
    // walk: re-collecting it on every re-walk would grow the walk-wide list (and the anyOf/oneOf options path
    // built from it) with duplicates.
    const sourceRef = (resolvedSchema as Record<symbol, unknown>)[RJSF_REF_KEY];
    if (typeof sourceRef === 'string') {
      pathList = [...pathList, sourceRef];
      if (expandedRefs && !expandedRefs.includes(sourceRef)) {
        expandedRefs.push(sourceRef);
      }
    }
  }

  if (PROPERTIES_KEY in resolvedSchema) {
    const updatedProps: RJSFSchema = {};
    for (const [key, value] of Object.entries(resolvedSchema[PROPERTIES_KEY] ?? {})) {
      // Mark cycles only when NOT in resolveAnyOfOrOneOfRefs mode. In simple (non-anyOf) resolution, a $ref cycle
      // in an object property always causes an infinite render loop and must be caught; in anyOf/oneOf mode a $ref
      // already expanded by an earlier option is collapsed on purpose (see the optionsPath handling below), so it
      // must not be marked.
      updatedProps[key] = resolveAllReferences(
        value as S,
        rootSchema,
        pathList,
        currentBaseURI,
        resolveAnyOfOrOneOfRefs,
        !resolveAnyOfOrOneOfRefs,
        expandedRefs,
        passCount,
      );
    }
    resolvedSchema = { ...resolvedSchema, [PROPERTIES_KEY]: updatedProps };
  }

  if (
    ITEMS_KEY in resolvedSchema &&
    !Array.isArray(resolvedSchema.items) &&
    typeof resolvedSchema.items !== 'boolean'
  ) {
    resolvedSchema = {
      ...resolvedSchema,
      // Array items are only rendered when data exists, so a $ref cycle here does NOT cause an infinite render.
      items: resolveAllReferences(
        resolvedSchema.items as S,
        rootSchema,
        pathList,
        currentBaseURI,
        resolveAnyOfOrOneOfRefs,
        false,
        expandedRefs,
        passCount,
      ),
    };
  }

  if (resolveAnyOfOrOneOfRefs) {
    // Read from the resolved schema, which is what every reader of its options picks the keyword from
    const key = getXxxOfKey<S>(resolvedSchema);
    if (key) {
      // Options are resolved in order, and refs materialized by one option stay on the path for the options after
      // it: an option that reuses a ref an earlier option already expanded collapses to the unexpanded skeleton.
      // This keeps the materialized result linear on DAGs of shared refs (two identical `$ref` options do not each
      // materialize the whole subgraph) while the path scoping above still prevents the expansion from leaking
      // into sibling subtrees.
      let optionsPath = pathList;
      resolvedSchema = {
        ...resolvedSchema,
        [key]: (resolvedSchema[key] as S[]).map((s: S) => {
          const expandedBefore = expandedRefs?.length ?? 0;
          const option = resolveAllReferences(
            s,
            rootSchema,
            optionsPath,
            currentBaseURI,
            resolveAnyOfOrOneOfRefs,
            false,
            expandedRefs,
            passCount,
          );
          if (expandedRefs && expandedRefs.length > expandedBefore) {
            optionsPath = [...optionsPath, ...expandedRefs.slice(expandedBefore)];
          }
          return option;
        }),
      };
    }
  }

  return deepEquals(schema, resolvedSchema) ? schema : resolvedSchema;
}

/** Returns the resolution path for a nested branch (an `allOf` element, a `then`/`else` schema or a `dependencies`
 * value) of a schema that was itself materialized by expanding a `$ref` earlier in this resolution. Keeping the
 * enclosing ref on the path lets a branch that refers back to the enclosing definition collapse as a cycle instead
 * of re-expanding without bound. As with the marker walk in `resolveAllReferences`, this only happens on re-walks
 * (`passCount > 0`): on the first pass of a fresh call the branch expands the ref one more level.
 *
 * @param schema - The schema whose branch is about to be resolved
 * @param recurseList - The list of refs already expanded on the current resolution path
 * @param passCount - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - `recurseList` plus the schema's source ref when it carries one on a re-walk, else `recurseList`
 */
function enclosingRefPath<S extends StrictRJSFSchema>(schema: S, recurseList: string[], passCount: number): string[] {
  if (passCount === 0) {
    return recurseList;
  }
  const sourceRef = (schema as Record<symbol, unknown>)[RJSF_REF_KEY];
  return typeof sourceRef === 'string' && !recurseList.includes(sourceRef) ? [...recurseList, sourceRef] : recurseList;
}

/** The keywords that constrain a value of a given type without naming the type itself. A typeless `additionalProperties`
 * subschema carrying any of them constrains the property it describes, so the property is not free to hold any type.
 */
const VALUE_KEYWORDS: string[] = [
  'enum',
  'const',
  'format',
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'items',
  'prefixItems',
  'additionalItems',
  'contains',
  'minContains',
  'maxContains',
  'minItems',
  'maxItems',
  'uniqueItems',
  'properties',
  'patternProperties',
  'additionalProperties',
  'propertyNames',
  'required',
  'dependentRequired',
  'minProperties',
  'maxProperties',
];

/** The keywords that constrain a value by way of other subschemas. They assert something about the value as surely as
 * the `VALUE_KEYWORDS` do, but they are left out of the stub: an `allOf` naming a type of its own would contradict the
 * type the stub takes from the data and fail to merge on every render, and the validator enforces them either way.
 */
const SUBSCHEMA_KEYWORDS: string[] = [
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
  'dependencies',
  'dependentSchemas',
  'unevaluatedItems',
  'unevaluatedProperties',
  '$ref',
  '$dynamicRef',
  '$recursiveRef',
];

/** The keywords that identify a subschema rather than describe a value. The stub is built once per property, so
 * copying them would give every sibling property the same identifier — and an `$id` naming a registered field would
 * route them all to it.
 */
export const IDENTIFIER_KEYWORDS: string[] = ['$id', '$anchor', '$dynamicAnchor', '$schema', '$vocabulary'];

/** The keywords that hold other subschemas for a `$ref` to name rather than describe a value. The stub drops the
 * `$ref` that would reach them, so copying them into every property would hand each one an unreachable copy that
 * `hashForSchema()` and `deepEquals()` then walk on every render.
 */
export const CONTAINER_KEYWORDS: string[] = ['$defs', 'definitions'];

/** Every keyword that constrains the value, for the reasons the first two lists above give. They are only ever
 * consulted together, and once per property key, so they are consulted as one.
 */
const CONSTRAINING_KEYWORDS = new Set<string>([...VALUE_KEYWORDS, ...SUBSCHEMA_KEYWORDS]);

/** The keywords no stub carries, whatever the stub keeps of the rest, for the reasons the two lists above give: both
 * reasons are about building a stub once per property key, not about what the stub then says of the value.
 */
const UNSTUBBABLE_KEYWORDS = new Set<string>([...IDENTIFIER_KEYWORDS, ...CONTAINER_KEYWORDS]);

/** Every keyword a guessed-type stub leaves out, for the reasons the three lists above give. They are only ever
 * consulted together, and once per property key, so they are consulted as one.
 */
const EXCLUDED_STUB_KEYWORDS = new Set<string>([...SUBSCHEMA_KEYWORDS, ...UNSTUBBABLE_KEYWORDS]);

/** Returns the copy of `subSchema` that a stub stands for one property with, without the keywords that identify the
 * subschema or hold others rather than describe the value. It is for the stub whose type the subschema only implies,
 * which is the form's own reading of what that one property holds rather than the subschema as it was written: a field
 * registered under an `$id` is for the schema that carries it, and routing every sibling property to such a field for a
 * type the schema never named would be the form's doing, not the schema's.
 *
 * The copy is spread rather than rebuilt key by key so that the symbol markers a resolved schema carries survive,
 * `RJSF_REF_KEY` above all: `resolveUiSchema()` reads that marker off the stub to apply the `ui:definitions` entry of
 * the `$ref` the property was described through, which `Object.entries()` would cost the property by not enumerating
 * it.
 *
 * @param subSchema - The schema describing the additional property
 * @returns - The copy to build the stub from
 */
function stubbableSchema<S extends StrictRJSFSchema = RJSFSchema>(subSchema: S): S {
  const schema = { ...subSchema } as GenericObjectType;
  UNSTUBBABLE_KEYWORDS.forEach((keyword) => delete schema[keyword]);
  return schema as S;
}

/** Builds the stub schema for an additional property whose own schema names no type, keeping what that schema says
 * about the value and giving it the type of the data the property currently holds, so that it renders as a field for
 * that data. Dropping the rest would cost the value its `enum`, `format` or range, leaving a field that neither
 * constrains the value the way the schema does nor offers the other types the schema might allow. The
 * `SUBSCHEMA_KEYWORDS`, `IDENTIFIER_KEYWORDS` and `CONTAINER_KEYWORDS` are not kept, and neither is a `default` of
 * another type than the data, which would re-seed a field of the data's type with a value it cannot hold.
 *
 * The stub is marked as guessed when the schema puts no constraint on the property at all, i.e. it is `true` or has
 * none of the `VALUE_KEYWORDS` or `SUBSCHEMA_KEYWORDS`. That marker tells the fallback UI the property is free to hold
 * any other type, so a schema that constrains the value must not carry it, or the UI would offer types that schema
 * rejects. Any other keyword — an annotation, an identifier, a container such as `$defs`, or one these lists do not
 * know — leaves the property unconstrained, so an unfamiliar keyword never locks the type in place.
 *
 * @param formData - The form data held by the additional property
 * @param [subSchema] - The `additionalProperties` schema describing the property, unless it is simply `true`
 * @returns - The stub schema for the additional property
 */
function guessedTypeSchema<S extends StrictRJSFSchema = RJSFSchema>(formData: unknown, subSchema: S = {} as S): S {
  const type = guessType(formData);
  const schema = { ...subSchema } as GenericObjectType;
  let isConstrained = false;
  Object.entries(subSchema).forEach(([key, value]) => {
    if (CONSTRAINING_KEYWORDS.has(key)) {
      isConstrained = true;
    }
    const isForeignDefault = key === 'default' && guessType(value) !== type;
    if (EXCLUDED_STUB_KEYWORDS.has(key) || isForeignDefault) {
      delete schema[key];
    }
  });
  schema.type = type;
  if (!isConstrained) {
    (schema as RJSFMarkedSchema)[GUESSED_TYPE_FLAG] = true;
  }
  return schema as S;
}

/** Builds the stub for an additional property described by `subSchema`, whose `$ref`s are expected to be resolved
 * already. A schema naming its `type` is stubbed as it stands, so a nullable `['integer', 'null']` keeps both names for
 * the field that offers a choice between them, and so is one offering `anyOf`/`oneOf` options, since the option the
 * value matches is what renders it; options that agree on a type are given it, the way `ObjectField` seeds a new
 * property of this very schema with that type. A schema that neither names a type nor offers options is given the type
 * `getAdditionalPropertyType()` reads out of the keywords that imply one, and otherwise the type of the data the
 * property holds, keeping what it does say about the value, so the property renders as a field for that data rather
 * than one no type can render.
 *
 * A stub that stands for the subschema as its author wrote it keeps the keywords that identify it, as every other
 * reader of the subschema does, so a field registered under its `$id` renders the properties it describes: that is the
 * one naming its own type, and the one offering options, whose options this hands on for `MultiSchemaField` to choose
 * between whether or not they agree on a type to name beside them. `stubbableSchema()` strips the identifiers off the
 * stub left, the one the form gave the type that keywords describing the value only imply, for the reason given there,
 * as `guessedTypeSchema()` strips them off the one whose type is guessed from the data.
 *
 * The type is read once per subschema object, which is what `namedTypes` remembers it under: the walk of the options
 * and the lookup of each `$ref` among them reads nothing but the subschema and the root schema, where a key no pattern
 * matches hands this the object's one `additionalProperties` again for every key the data holds.
 *
 * @param subSchema - The schema describing the additional property, from `additionalProperties`, a matching pattern or
 *          `unevaluatedProperties`
 * @param formData - The form data held by the additional property
 * @param rootSchema - The root schema a `$ref` among the subschema's options names a definition of
 * @param namedTypes - The type each subschema stubbed so far was read as, keyed on the subschema itself
 * @returns - The stub schema for the additional property
 */
function stubSchemaForSubSchema<S extends StrictRJSFSchema = RJSFSchema>(
  subSchema: S,
  formData: unknown,
  rootSchema: S | undefined,
  namedTypes: Map<S, string | undefined>,
): S {
  if (subSchema.type !== undefined) {
    return { ...subSchema };
  }
  if (!namedTypes.has(subSchema)) {
    namedTypes.set(subSchema, getAdditionalPropertyType<S>(subSchema, rootSchema));
  }
  const type = namedTypes.get(subSchema);
  const offersOptions = getXxxOfOptions<S>(subSchema) !== undefined;
  if (type === undefined) {
    return offersOptions ? { ...subSchema } : guessedTypeSchema<S>(formData, subSchema);
  }
  return { ...(offersOptions ? subSchema : stubbableSchema<S>(subSchema)), type };
}

/** Returns the subschemas a `dependencies` entry merges into the schema it belongs to for the `formData` in hand,
 * which `declaredPropertyNames()` reads for the names they bring with them.
 *
 * A dependent schema's `oneOf` is not a choice `MultiSchemaField` offers: `withExactlyOneSubschema()` settles it from
 * the data, merging in the one branch whose own schema for the dependency key the data matches, so the names that
 * branch declares are rendered by whatever renders this schema. Read as options they would be left to a selector that
 * is never on screen, and a name only the matching branch declares would be stubbed beside the field that branch
 * renders it with. The branch is selected the way that function selects it, down to reading the condition behind the
 * `$ref` a branch is spelled as and to merging nothing where no single branch qualifies, which is the case it drops
 * the `oneOf` in rather than rendering any of it. The dependency itself is read behind the `$ref` it may be spelled as
 * for the same reason, since that is where its branches are then written. Without a `rootSchema` to look a reference up
 * in and match the branches against, none of them is read and the names they declare are left to be stubbed, as the
 * branches of an `if` are.
 *
 * @param context - The `SchemaContext` whose `validator` settles which branch the data matches
 * @param dependent - What the `dependencies` entry holds, which is a schema here and a list of required names elsewhere
 * @param dependencyKey - The name the entry is keyed under, which its branches name their condition on
 * @param rootSchema - The root schema the branches are matched against, when there is one
 * @param formData - The form data the object holds
 * @returns - The subschemas the entry merges in
 */
function dependencySubschemas<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  dependent: S | boolean,
  dependencyKey: string,
  rootSchema: S | undefined,
  formData: GenericObjectType,
): (S | boolean)[] {
  if (!isObject(dependent)) {
    return [dependent];
  }
  const { [ONE_OF_KEY]: ownOneOf, ...dependentWithoutOneOf } = dependent;
  // A dependency spelled as a `$ref` holds its `oneOf` behind that reference, and `withDependentSchema()` resolves the
  // dependency before it takes the `oneOf` off, so the branch is settled from the data for that spelling too. Read
  // without following the reference it offers no branches, and a name the matching branch declares would be stubbed
  // beside the field that branch renders it with, which is what the inline spelling no longer does
  const oneOf = ownOneOf ?? referencedDefinition<S>(dependent, rootSchema, new Set<string>())?.[ONE_OF_KEY];
  if (!Array.isArray(oneOf)) {
    return [dependent];
  }
  // An empty `oneOf` of the dependency's own is how the rest of it is read without those branches: a dependency spelled
  // as a `$ref` leaves them behind that reference for `referencedDefinition()` to read as options beside the branch
  // settled here, which strips whatever the referring schema declares itself. Read as options, a name every branch
  // declares counts as one the form renders even where no single branch qualifies and none of the `oneOf` is merged in
  const withoutOneOf = { ...dependentWithoutOneOf, [ONE_OF_KEY]: [] as S[] } as unknown as S;
  const matching =
    rootSchema === undefined
      ? []
      : (oneOf as (S | boolean)[]).filter((branch) => {
          if (!isObject(branch)) {
            return false;
          }
          // A branch spelled as a `$ref` names its condition behind that reference, which `withDependentSchema()`
          // resolves before `withExactlyOneSubschema()` matches it. Read unresolved it names no condition at all, so
          // no branch would qualify and a name the matching branch declares would be stubbed beside the field that
          // branch renders it with. `referencedDefinition()` strips whatever the branch shadows, which is how
          // resolution reads a reference, so a `properties` the branch declares itself answers on its own
          const branchProperties =
            branch[PROPERTIES_KEY] ?? referencedDefinition<S>(branch, rootSchema, new Set<string>())?.[PROPERTIES_KEY];
          const conditionPropertySchema = branchProperties?.[dependencyKey];
          if (!conditionPropertySchema) {
            return false;
          }
          const conditionSchema = { type: 'object', properties: { [dependencyKey]: conditionPropertySchema } } as S;
          return context.validator.isValid(conditionSchema, formData, rootSchema);
        });
  return matching.length === 1 ? [withoutOneOf, matching[0]] : [withoutOneOf];
}

/** Returns the property names a `schema` declares, including the ones it declares through the `allOf` entries it is
 * composed of, the `$ref` it is spelled as, the branch its `if` settles for the `formData` and the `dependencies` that
 * data brings in — every subschema that is merged into it before it renders, so that each of them declares its names as
 * the schema's own.
 *
 * The condition is put to the validator, which is the question `resolveCondition()` answers to merge that branch in, so
 * the branch read here is the branch whose properties the form renders; a dependency is read on the same terms
 * `processDependencies()` applies it on, which are that the data has the key and the schema declares it, so that the
 * names read here are the ones the merge is about to bring in. Without a `rootSchema` to resolve the condition
 * against, neither branch is read and the names it declares are left to be stubbed instead. A reference is looked up
 * rather than the schema resolved: the names are all that is wanted here, where resolving every option of every
 * expandable object would cost each render the merge `MultiSchemaField` already pays for the one option on screen.
 *
 * Each of those subschemas is read through `namesOptionRenders()`, so the names every one of its own `anyOf`/`oneOf`
 * options renders count as names the schema renders too: a `$ref` is how an option usually names the choice it is, and
 * a name behind that reference is no less the merged schema's than one it declares inline. That is also what answers
 * for a merged subschema that takes keys its own `properties` don't name, which declares no name in particular: the
 * merge gives the schema that keyword, so `retrieveSchema()` stubs every key the data holds for it and it renders
 * whatever key it is asked about. There is no list of names to answer with then, which is `undefined`, so an option
 * spelled as a `$ref` to a map is read as the map it is rather than as the names its definition happens to declare.
 * The schema's own keyword is left out of the question, since the object `stubExistingAdditionalProperties()` is
 * stubbing has one by definition.
 *
 * @param context - The `SchemaContext` whose `validator` settles a condition
 * @param schema - The schema whose declared names are desired
 * @param rootSchema - The root schema a reference names a definition of, when there is one to look it up in
 * @param formData - The form data the object holds, which its conditions and dependencies are evaluated against
 * @param followedRefs - The references already followed on this walk
 * @param matchedOptionOnly - Whether only the option its own data matches is read among an option's own options
 * @returns - The names the schema and the subschemas merged into it declare between them, or undefined when one of
 *          those subschemas takes every key the data holds
 */
function declaredPropertyNames<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S | undefined,
  formData: GenericObjectType,
  followedRefs: Set<string>,
  matchedOptionOnly: boolean,
): string[] | undefined {
  const merged: (S | boolean | undefined)[] = Array.isArray(schema[ALL_OF_KEY])
    ? [...(schema[ALL_OF_KEY] as (S | boolean)[])]
    : [];
  // The references followed to reach this schema, which this walk adds its own to without adding to the lists of the
  // walks beside it
  const refs = new Set(followedRefs);
  merged.push(referencedDefinition<S>(schema, rootSchema, refs));
  if (IF_KEY in schema && rootSchema !== undefined) {
    const holds = context.validator.isValid(schema[IF_KEY] as S, formData, rootSchema);
    merged.push((holds ? schema[THEN_KEY] : schema[ELSE_KEY]) as S | boolean | undefined);
  }
  const properties = schema[PROPERTIES_KEY];
  const dependencies = schema[DEPENDENCIES_KEY];
  if (isObject(dependencies)) {
    const applying = Object.entries(dependencies).filter(
      ([key]) => getByPath(formData, key) !== undefined && (!properties || key in properties),
    );
    for (const [key, dependent] of applying) {
      merged.push(...dependencySubschemas<S, F>(context, dependent as S | boolean, key, rootSchema, formData));
    }
  }
  const names = Object.keys(properties ?? {});
  for (const subSchema of merged.filter((entry) => isObject(entry))) {
    // Each merged subschema is read as `namesOptionRenders()` reads an option, so that one offering `anyOf`/`oneOf`
    // options of its own contributes the names every one of them renders: a `$ref` is how an option usually names the
    // choice it is, and a name behind that reference has the option's field as much as one declared inline does. It
    // follows the references reaching this schema without adding to the lists of the entries beside it, as an option
    // does, so two entries naming the same definition both read it: one that shadows the definition's `properties`
    // would otherwise leave the names behind it to be stubbed over the field the entry beside it renders them with
    const subNames = namesOptionRenders<S, F>(
      context,
      subSchema,
      rootSchema,
      formData,
      new Set(refs),
      matchedOptionOnly,
    );
    if (subNames === undefined) {
      return undefined;
    }
    names.push(...subNames);
  }
  return names;
}

/** Returns the names an `anyOf`/`oneOf` option renders as properties of its own once it is selected, which are the
 * names it declares and the ones every one of its own options does. An option that takes keys of its own names none of
 * them in particular: `retrieveSchema()` stubs every key the form data holds outside its `properties` for it, the way
 * it does for the object around it, so it renders whatever key it is asked about and this says so with `undefined`.
 * The option is read for that keyword through the subschemas merged into it as much as through its own, since a `$ref`
 * is how an option usually names the map it is.
 *
 * @param context - The `SchemaContext` whose `validator` settles a condition
 * @param option - The option whose rendered names are desired
 * @param rootSchema - The root schema a reference names a definition of, when there is one to look it up in
 * @param formData - The form data the object holds, which the option's conditions are evaluated against
 * @param followedRefs - The references already followed on this walk
 * @param matchedOptionOnly - Whether only the option the data matches is read among the option's own options
 * @returns - The names the option renders, or undefined for an option that renders every key the data holds
 */
function namesOptionRenders<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  option: S,
  rootSchema: S | undefined,
  formData: GenericObjectType,
  followedRefs: Set<string>,
  matchedOptionOnly: boolean,
): Set<string> | undefined {
  if (allowsAdditionalProperties<S>(option)) {
    return undefined;
  }
  const nestedNames = namesTheOptionsRender<S, F>(
    context,
    option,
    rootSchema,
    formData,
    followedRefs,
    matchedOptionOnly,
  );
  if (nestedNames === undefined) {
    return undefined;
  }
  const declaredNames = declaredPropertyNames<S, F>(
    context,
    option,
    rootSchema,
    formData,
    followedRefs,
    matchedOptionOnly,
  );
  return declaredNames === undefined ? undefined : new Set([...declaredNames, ...nestedNames]);
}

/** Returns the names a `schema`'s `anyOf`/`oneOf` options render, which are either the names every one of them renders
 * or the names the one the data matches does, depending on what the keyword describing the object's extra keys makes of
 * a name the option on screen is the only one to render.
 *
 * Under `additionalProperties`, or a matching pattern, that keyword describes the key whichever option is chosen, so
 * only a name every option renders is left to them: the option on screen is the user's to choose and
 * `retrieveSchema()` leaves the options for `MultiSchemaField` to choose between rather than merging the chosen one in,
 * so a name the other options don't render would have no field at all under them and the value it holds nothing to
 * edit or remove it with. Under `unevaluatedProperties` the keyword says nothing about a key the matching option
 * evaluates, which is every key that option declares, so a stub for one of its names is not a second field for the
 * value but the wrong schema over it; a name only another option declares is a key nothing evaluates, which is the
 * keyword's to describe and the object's to stub, so only the matching option is read. That option is matched with
 * `getFirstMatchingOption()` over the options with their references resolved, which is the form
 * `resolveAnyOrOneOfSchemas()` scores them in, so a precompiled validator has a function compiled for it.
 *
 * It is not always the option on screen. `MultiSchemaField` picks with `getClosestMatchingOption()`, which scores
 * rather than takes the first that validates, and it keeps a choice the user made in the dropdown, which is state
 * nothing here can read. Where the two disagree, a name the option on screen declares is stubbed beside the field
 * that option renders it with: which keys an option renders is a render-time fact, and this answers it from the
 * schema and the data alone.
 *
 * A schema offering no options renders no name this way, and one whose every option takes keys of its own renders every
 * key the data holds, which is `undefined` as it is for a single option.
 *
 * @param context - The `SchemaContext` whose `validator` settles a condition and matches an option
 * @param schema - The schema whose options are to be read
 * @param rootSchema - The root schema a reference names a definition of, when there is one to look it up in
 * @param formData - The form data the object holds, which an option's conditions are evaluated against and which the
 *          matching option is matched on
 * @param followedRefs - The references already followed on this walk
 * @param matchedOptionOnly - Whether only the option the data matches is read, rather than every option
 * @returns - The names the options render between them, or undefined when every one of them renders every key the data
 *          holds
 */
function namesTheOptionsRender<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S | undefined,
  formData: GenericObjectType,
  followedRefs: Set<string>,
  matchedOptionOnly: boolean,
): Set<string> | undefined {
  const options = getXxxOfOptions<S>(schema)?.options ?? [];
  if (options.length === 0) {
    return new Set<string>();
  }
  const read =
    matchedOptionOnly && rootSchema !== undefined
      ? [matchingOption<S, F>(context, schema, options, rootSchema, formData)]
      : options;
  // Each option follows the references this walk has followed without adding to the others' lists, so two options
  // naming the same definition both read it rather than the second one reading a reference already followed
  const namesPerOption = read.map((option) =>
    isObject(option)
      ? namesOptionRenders<S, F>(context, option, rootSchema, formData, new Set(followedRefs), matchedOptionOnly)
      : new Set<string>(),
  );
  const naming = namesPerOption.filter((names): names is Set<string> => names !== undefined);
  if (naming.length === 0) {
    return undefined;
  }
  return naming.reduce((shared, names) => new Set([...shared].filter((name) => names.has(name))));
}

/** Returns the one of an object's `options` that the `formData` matches, which is the option `MultiSchemaField`
 * renders for that data and so the only one evaluating anything the object holds.
 *
 * The references are resolved before the options are scored because that is the form `resolveAnyOrOneOfSchemas()`
 * scores them in, and a precompiled validator has a function compiled for the forms that pass through there. An option
 * whose reference names no definition, or names one circularly, is scored as it stands: it says as little about the
 * data as `referencedDefinition()` reads off such a reference, and whatever resolves the option to render it reports
 * the reference on its own, where a throw here would take down an object that asked nothing but which key to stub.
 *
 * @param context - The `SchemaContext` whose `validator` scores the options
 * @param schema - The object schema offering the options, read for the discriminator it names
 * @param options - The options to match the data against
 * @param rootSchema - The root schema a reference among the options names a definition of
 * @param formData - The form data the object holds
 * @returns - The option the data matches
 */
function matchingOption<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  options: S[],
  rootSchema: S,
  formData: GenericObjectType,
): S {
  const resolved = options.map((option) => {
    try {
      return resolveAllReferences(option, rootSchema, []);
    } catch {
      return option;
    }
  });
  const matched = getFirstMatchingOption<GenericObjectType, S, F>(
    context,
    formData,
    resolved,
    rootSchema,
    getDiscriminatorFieldFromSchema<S>(schema),
  );
  return options[matched];
}

/** Returns the names another schema renders as properties of its own for an object that `retrieveSchema()` is stubbing
 * the extra keys of, so that a key one of them names is no more stubbed here than one the object's own `properties`
 * name: it would otherwise be given a field beside the one that schema renders for it, giving the one value two fields
 * to be written from, under one pair of ids.
 *
 * Those schemas are the ones merged into the object and the `anyOf`/`oneOf` options rendered beside it, which the
 * object's own `properties` are missing the names of for opposite reasons: a merge may be left undone, where an option
 * is left to `MultiSchemaField` to choose between on purpose.
 *
 * Which options count is settled once here, from the keyword the object describes its extra keys with:
 * `unevaluatedProperties` describes a key no subschema evaluates, which the matching option's own properties are not
 * and another option's are, where `additionalProperties` and a pattern describe the key whatever an option makes of
 * it, so every option counts and only a name all of them render is left to them. A key one of the object's patterns
 * also matches follows the object's answer rather than its own, the question being the object's to settle: leaving the
 * name to the option that evaluates it costs the value a field while another option is on screen, where stubbing it
 * writes a schema over a value the option describes.
 *
 * @param context - The `SchemaContext` whose `validator` settles a condition
 * @param schema - The object schema whose extra keys are being stubbed
 * @param rootSchema - The root schema a reference names a definition of, when there is one to look it up in
 * @param formData - The form data the object holds, which the conditions it reaches are evaluated against
 * @returns - The names rendered elsewhere, or undefined when every key the data holds is
 */
function namesRenderedElsewhere<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S | undefined,
  formData: GenericObjectType,
): Set<string> | undefined {
  // `unevaluatedProperties` is the keyword describing the extra keys only where there is no `additionalProperties` for
  // `additionalPropertiesKeyword()` to give precedence to, which is the one place that reads it
  const matchedOptionOnly =
    schema.additionalProperties === undefined && additionalPropertiesKeyword<S>(schema) !== undefined;
  const optionNames = namesTheOptionsRender<S, F>(
    context,
    schema,
    rootSchema,
    formData,
    new Set<string>(),
    matchedOptionOnly,
  );
  if (optionNames === undefined) {
    return undefined;
  }
  // A subschema merged into this object that takes keys of its own is this object taking them, which is the case the
  // stub is for rather than one to leave to another schema, so the walk saying so names nothing rendered elsewhere
  const declaredNames =
    declaredPropertyNames<S, F>(context, schema, rootSchema, formData, new Set<string>(), matchedOptionOnly) ?? [];
  return new Set([...declaredNames, ...optionNames]);
}

/** Creates new 'properties' items for each key in the `formData`
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param theSchema - The schema for which the existing additional properties is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [aFormData] - The current formData, if any, to assist retrieving a schema
 * @returns - The updated schema with additional properties stubbed
 */
export function stubExistingAdditionalProperties<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, theSchema: S, rootSchema?: S, aFormData?: T): S {
  // Clone the schema so that we don't ruin the consumer's original
  const schema = {
    ...theSchema,
    properties: { ...theSchema.properties },
  };

  // make sure formData is an object
  const formData: GenericObjectType = aFormData && isObject(aFormData) ? aFormData : {};
  // The keys to stub are the ones the schema has no property for. `Object.hasOwn`, since `in` answers for the names on
  // `Object.prototype` too, and a property called `constructor` or `toString` left unstubbed is a value with no field
  // to edit or remove it with
  const extraKeys = Object.keys(formData).filter((key) => !Object.hasOwn(schema.properties, key));
  if (extraKeys.length === 0) {
    return schema;
  }
  // Asked once, and only for an object whose data holds a key to ask it about: the walk of every option and the lookup
  // of every `$ref` among them is work an object with no such key never has a question to answer with
  const renderedElsewhere = namesRenderedElsewhere<S, F>(context, schema, rootSchema, formData);
  if (renderedElsewhere === undefined) {
    // A schema merged into this one, or an option rendered beside it, renders every key the data holds as a property
    // of its own
    return schema;
  }
  // A key one of those schemas renders is left to it: a stub would give the one value a second field to be written from
  const keysToStub = extraKeys.filter((key) => !renderedElsewhere.has(key));
  // Shared by every key stubbed here, since the keys no pattern matches are all described by the one subschema
  const namedTypes = new Map<S, string | undefined>();
  for (const key of keysToStub) {
    const keySchema = getAdditionalPropertySchema<S>(schema, key);
    let stub: S;
    if (keySchema === false) {
      // The schema forbids the key, so the property has no subschema of its own to render it with and no value the
      // schema allows
      stub = { type: 'null' } as S;
    } else if (isObject(keySchema)) {
      // A `$ref` and the `allOf` of the matching patterns describe the property through another schema, so they are
      // resolved into the one schema they describe before it is stubbed. Nothing else is: a subschema that describes the
      // property itself is stubbed as it stands, and `SchemaField` resolves the stub again to render it, so resolving
      // the whole of it here is work the property pays for twice
      const described =
        REF_KEY in keySchema || Array.isArray(keySchema[ALL_OF_KEY])
          ? retrieveSchema<T, S, F>(context, keySchema, rootSchema, formData[key])
          : keySchema;
      stub = stubSchemaForSubSchema<S>(described, formData[key], rootSchema, namedTypes);
    } else {
      // What is left is a `true`, or a keyword the schema leaves out, which JSON Schema reads as `true`: anything goes,
      // including a key none of the `patternProperties` patterns match, which the schema allows all the same and so
      // gets a field for the data it holds
      stub = guessedTypeSchema<S>(formData[key]);
    }
    // Set our additional property flag so we know it was dynamically added
    (stub as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
    // `defineProperty`, since assigning a key called `__proto__` runs the setter `Object.prototype` carries: it would
    // re-point this clone's prototype at the stub and declare no property, leaving the value with no field at all
    Object.defineProperty(schema.properties, key, {
      value: stub,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  return schema;
}

/** Merges an `allOf` schema into a single flat schema, delegating to the context's `customMergeAllOf` when it has one
 * and falling back to @x0k/json-schema-merge's shallow `allOf` merge otherwise. A `customMergeAllOf` may reject
 * subschemas it considers irreconcilable, so this never throws: it warns once and returns the schema without its
 * `allOf`, reporting the failure through `merged` for a caller that has to react to it.
 *
 * The entries are expected to have their `$ref`s resolved already. The shallow merge hoists an entry's `$ref` onto the
 * merged schema rather than following it, so an unresolved entry loses the referenced schema's properties and hands a
 * `customMergeAllOf` a `$ref` the form's own merge never sees.
 *
 * @param context - The `SchemaContext` whose `customMergeAllOf`, if any, does the merging
 * @param schema - The schema containing an `allOf` keyword
 * @returns The merged schema and whether the merge succeeded; on failure the schema is the one given, less its `allOf`
 */
export function mergeAllOf<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
): { schema: S; merged: boolean } {
  try {
    return {
      schema: context.customMergeAllOf ? context.customMergeAllOf(schema) : (shallowAllOfMerge(schema) as S),
      merged: true,
    };
  } catch (e) {
    logOnce('could not merge subschemas in allOf:\n', 'warn', e);
    const { allOf, ...schemaWithoutAllOf } = schema;
    return { schema: schemaWithoutAllOf as S, merged: false };
  }
}

/** Internal handler that retrieves an expanded schema that has had all of its conditions, additional properties,
 * references and dependencies resolved and merged into the `schema` given a `context`, `rootSchema` and `rawFormData`
 * that is used to do the potentially recursive resolution. If `expandAllBranches` is true, then all possible branches
 * of the schema and its references, conditions and dependencies are returned.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema
 * @param [expandAllBranches=false] - Flag, if true, will return all possible branches of conditions, any/oneOf and
 *          dependencies as a list of schemas
 * @param [recurseList=[]] - The list of refs already expanded on the current resolution path, used to detect
 *          cycles; callers should omit this
 * @param [resolveAnyOfOrOneOfRefs] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @param [preserveDependencies=false] - Leave dependencies unresolved for default computation
 * @param [passCount=0] - Internal backstop counting the passes of the `resolveReference` fixpoint loop;
 *          resolution collapses to the schema resolved so far, flagged as a cycle, if a schema ever stops
 *          terminating. Callers should omit this
 * @returns - The schema(s) resulting from having its conditions, additional properties, references and dependencies
 *          resolved. Multiple schemas may be returned if `expandAllBranches` is true.
 */
export function retrieveSchemaInternal<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  rawFormData?: T,
  expandAllBranches = false,
  recurseList: string[] = [],
  resolveAnyOfOrOneOfRefs?: boolean,
  preserveDependencies = false,
  passCount = 0,
): S[] {
  if (!isObject(schema)) {
    return [{} as S];
  }
  const resolvedSchemas = resolveSchema<T, S, F>(
    context,
    schema,
    rootSchema,
    expandAllBranches,
    recurseList,
    rawFormData,
    resolveAnyOfOrOneOfRefs,
    preserveDependencies,
    passCount,
  );
  return resolvedSchemas.flatMap((s: S) => {
    let resolvedSchema = s;
    if (IF_KEY in resolvedSchema) {
      return resolveCondition<T, S, F>(
        context,
        resolvedSchema,
        rootSchema,
        expandAllBranches,
        recurseList,
        rawFormData,
        preserveDependencies,
        passCount,
      );
    }
    if (ALL_OF_KEY in resolvedSchema) {
      // resolve allOf schemas. A form always merges an `allOf`, so even `expandAllBranches` merges it: the subschemas it
      // validates against are the merged schema's, which the unmerged branches need not hold -- a `customMergeAllOf` can
      // rewrite them, and only the merged schema has the properties its `patternProperties` apply to
      // Collect Symbol-keyed properties from allOf subschemas before merging; shallowAllOfMerge
      // (external library) only operates on string keys and will drop them.
      const allOfSymbols: Record<symbol, unknown> = {};
      resolvedSchema.allOf?.forEach((allOfItem) => {
        // A boolean subschema carries no symbols; `getOwnPropertySymbols` coerces it and returns an empty list
        for (const sym of Object.getOwnPropertySymbols(allOfItem)) {
          if (!(sym in allOfSymbols)) {
            allOfSymbols[sym] = (allOfItem as any)[sym];
          }
        }
      });
      const { schema: mergedSchema, merged } = mergeAllOf<S, F>(context, resolvedSchema);
      if (!merged) {
        // The rest of this function describes a merged schema, so a failed merge stops here with the `allOf` already
        // dropped rather than running the `patternProperties` and `additionalProperties` steps over an unmerged one
        return mergedSchema;
      }
      resolvedSchema = mergedSchema;
      // Re-apply collected Symbol properties that the merge dropped.
      for (const sym of Object.getOwnPropertySymbols(allOfSymbols)) {
        (resolvedSchema as any)[sym] = allOfSymbols[sym];
      }
    }
    let withMergedProperties = [resolvedSchema];
    const { properties } = resolvedSchema;
    if (properties && PATTERN_PROPERTIES_KEY in resolvedSchema) {
      // Merging a property with its matching patterns resolves the result, which for a key holding a `$ref` back to
      // this schema never terminates, so the reference this schema was itself reached through seeds that resolution
      // and stops it. It is read off the schema before the merge first, since `mergeAllOf` drops the Symbol keys and
      // the re-apply above recovers only the `allOf` entries'. That one reference seeds the merge rather than
      // `recurseList`, which holds the path this schema was reached by and would read a key's own `$ref` as a cycle
      const ownRef = refOf<S>(s) ?? refOf<S>(resolvedSchema);
      const mergeRecurseList = ownRef === undefined ? [] : [ownRef];
      // A merged property's branches are each one a form can render it with, so `expandAllBranches` is passed on. They
      // are varied one property at a time rather than in every combination with the other properties': what reads a
      // branch reads one property, and the combinations grow as the product of the branch counts
      const branchesByKey = Object.keys(properties).flatMap((key) => {
        // A stub for an extra key is the merge of the patterns matching it already, with the keywords a stub leaves
        // out left out, so merging it with those patterns a second time takes them back. The second time comes of
        // retrieving a schema that has been retrieved before, which `SchemaField` and `ObjectField` do to the same
        // object on every render: without this the key would take back the `$id` that routes every sibling to one
        // registered field, or a `default` of the pattern's type over a value of another, that the stub dropped on
        // purpose. The stubbing runs after this merge, so a key skipped here is one an earlier pass stubbed
        const property = properties[key];
        if (isObject(property) && (property as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG]) {
          return [];
        }
        const matchingProperties = getMatchingPatternProperties(resolvedSchema, key);
        if (Object.keys(matchingProperties).length === 0) {
          return [];
        }
        const patternSchemas = Object.values(matchingProperties);
        // Resolving the merge of a property that refers back to this schema is what the seed above stops, but
        // stopping it leaves the `$ref` a literal, and a merge of a literal `$ref` with the patterns' keywords is
        // read later by `resolveAllReferences()` as `{ ...target, ...merged }` -- a shallow spread, where a
        // `properties` the patterns contribute replaces the target's own rather than joining it. The merge is left
        // undone instead, flagged as the cycle it is: the key refers back to the schema that holds it, which only the
        // `allOf` around it hides from `resolveAllReferences()`, and the flag is what tells `SchemaField` to render a
        // cycle indicator rather than nesting the key's fields until the heap runs out. The marker alongside it is
        // what an outer level reads, since the cycle flag is one resolution sets on keys this merge still applies to
        const propertySchema = isObject(property) ? (property as S) : undefined;
        const propertyRef = refOf<S>(propertySchema);
        if (propertyRef !== undefined && mergeRecurseList.includes(propertyRef)) {
          return [
            {
              key,
              branches: [
                {
                  allOf: [property, ...patternSchemas],
                  [RJSF_REF_CYCLE_KEY]: true,
                  [PATTERN_MERGE_LEFT_UNDONE]: true,
                } as unknown as S,
              ],
            },
          ];
        }
        // This runs again at every level that resolves its way back here, so a key whose merge an inner level left
        // undone is recognised by the marker that level set and left alone, rather than having the patterns added a
        // second time. The marker says so rather than the shape doing: an `allOf` holding the patterns is one a schema
        // may also declare itself, and reading that as a merge already made leaves the key unresolved
        if (propertySchema !== undefined && (propertySchema as RJSFMarkedSchema)[PATTERN_MERGE_LEFT_UNDONE]) {
          return [];
        }
        const branches = retrieveSchemaInternal<T, S, F>(
          context,
          { allOf: [property, ...patternSchemas] } as S,
          rootSchema,
          getByPath<T>(rawFormData, key),
          expandAllBranches,
          mergeRecurseList,
          undefined,
          preserveDependencies,
        );
        return [{ key, branches }];
      });
      const firstBranches = Object.fromEntries(branchesByKey.map(({ key, branches: [first] }) => [key, first]));
      const withFirstBranches: S = { ...resolvedSchema, properties: { ...properties, ...firstBranches } };
      withMergedProperties = [
        withFirstBranches,
        ...branchesByKey.flatMap(({ key, branches }) =>
          branches.slice(1).map((branch) => ({
            ...withFirstBranches,
            properties: { ...withFirstBranches.properties, [key]: branch },
          })),
        ),
      ];
    }
    // Every entry of `withMergedProperties` is `resolvedSchema` under different `properties`, so what it says about
    // `patternProperties` and `additionalProperties` is the same for all of them
    if (!allowsAdditionalProperties<S>(resolvedSchema)) {
      return withMergedProperties;
    }
    return withMergedProperties.map((schemaWithProperties) =>
      stubExistingAdditionalProperties<T, S, F>(context, schemaWithProperties, rootSchema, rawFormData),
    );
  });
}

/** Returns the `$ref` the given schema holds or was resolved from, if any. A resolved schema no longer holds the
 * reference as a key, so the one `resolveAllReferences()` marked it with is what names it.
 *
 * @param schema - The schema to read the reference off, if there is one to read it off at all
 * @returns - The `$ref` the schema holds or was resolved from, or undefined when it has neither
 */
function refOf<S extends StrictRJSFSchema = RJSFSchema>(schema: S | undefined): string | undefined {
  // A reference the schema still holds comes first, since that is the one about to be resolved and so the one a
  // merge of this schema would follow round again. `resolveUiSchema()` reads the same two the other way about, for
  // the opposite reason: it is naming where a resolved schema came from, not what it is about to resolve
  return declaredRef<S>(schema) ?? resolvedFromRef<S>(schema);
}

/** Resolves an `anyOf` or `oneOf` within a schema (if present) to the list of schemas returned from
 * `retrieveSchemaInternal()` for the best matching option. If `expandAllBranches` is true, then a list of schemas for ALL
 * options are retrieved and returned.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema, defaults to an empty object
 * @param [recurseList=[]] - The list of recursive references already processed
 * @returns - Either an array containing the best matching option or all options if `expandAllBranches` is true
 */
export function resolveAnyOrOneOfSchemas<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  rawFormData?: T,
  recurseList: string[] = [],
) {
  const xxxOfKey = getXxxOfKey<S>(schema);
  if (xxxOfKey) {
    const { [ANY_OF_KEY]: _anyOf, [ONE_OF_KEY]: _oneOf, ...withoutOptions } = schema;
    const otherKey = xxxOfKey === ANY_OF_KEY ? ONE_OF_KEY : ANY_OF_KEY;
    // The schema parser walks every branch a precompiled validator must cover, so when expanding them all the keyword
    // that isn't read stays on each result for it to reach. A rendered schema drops it, since what is rendered from the
    // result is its own options, and one that kept the other keyword would render those instead
    const remaining =
      expandAllBranches && otherKey in schema ? { ...withoutOptions, [otherKey]: schema[otherKey] } : withoutOptions;
    let anyOrOneOf = schema[xxxOfKey] as S[];
    // An empty list has no option to merge in, so what the schema declares besides it stands on its own
    if (anyOrOneOf.length === 0) {
      return [remaining as S];
    }
    // Ensure that during expand all branches we pass an object rather than undefined so that all options are interrogated
    const formData = rawFormData === undefined && expandAllBranches ? ({} as T) : rawFormData;
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    anyOrOneOf = anyOrOneOf.map((s) => resolveAllReferences(s, rootSchema, []));
    // Call this to trigger the set of isValid() calls that the schema parser will need
    const option = getFirstMatchingOption<T, S, F>(context, formData, anyOrOneOf, rootSchema, discriminator);
    if (expandAllBranches) {
      // Also trigger isValid() for the relaxed variants so that precompiled validators capture their hashes.
      // omitExtraData's handleOneOf relaxes additionalProperties:false → true before scoring; those mutated
      // schemas must be present in a precompiled validator's compiled set or isValid() will throw at runtime.
      // Using getFirstMatchingOption (rather than calling isValid directly) ensures that the augmented forms
      // of each option (as constructed internally by getFirstMatchingOption for options with properties) are
      // also captured. The return value is discarded — the call is purely for ParserValidator's side effect.
      const relaxed = relaxOptionsForScoring<S>(anyOrOneOf, false, rootSchema);
      getFirstMatchingOption<T, S, F>(context, formData, relaxed, rootSchema, discriminator);
      // `MultiSchemaField` scores the options it has retrieved rather than the ones the schema declares, so an option
      // that resolves into something else -- one that is an `allOf`, say -- is scored in that resolved form too. It
      // retrieves with the real form data, which this has none of, so an option whose retrieved form depends on the
      // data is still reached only in the forms an empty retrieval produces: a key an option's `additionalProperties`
      // describes is stubbed into its `properties` once the user adds one, and no parse can enumerate those
      const retrievedOptions = anyOrOneOf.flatMap((item) =>
        // The options share the list, since a `$ref` one of them resolves is not one a sibling has already been
        // through: resolution extends the path it is given into a new list rather than appending to that one, which is
        // also why the `properties` loop of `resolveAllReferences()` hands each property the same one
        retrieveSchemaInternal<T, S, F>(context, item, rootSchema, formData, true, recurseList),
      );
      getFirstMatchingOption<T, S, F>(context, formData, retrievedOptions, rootSchema, discriminator);
      // `MultiSchemaField` also validates a retrieved option as it stands, rather than scoring it: when a parent
      // declines the switch to another option, the data still fitting the chosen one is what keeps it. That asks for
      // the option under the derived `$id` scoring gives it, since the retrieved form is not what the option's own
      // `$id` names, so the derivation is applied to the option here too
      retrievedOptions.forEach((item) => context.validator.isValid(withVariantId<S>(item), formData, rootSchema));
      getFirstMatchingOption<T, S, F>(
        context,
        formData,
        relaxOptionsForScoring<S>(retrievedOptions),
        rootSchema,
        discriminator,
      );
      return anyOrOneOf.map((item) => mergeSchemas(remaining, item) as S);
    }
    return [mergeSchemas(remaining, anyOrOneOf[option]) as S];
  }
  return [schema];
}

/** The relaxed form of each option that had to be relaxed, memoized by the option it was relaxed from. Relaxing
 * derives an `$id`, which hashes the option, and `omitExtraData()` relaxes the options of a `oneOf` on every call, so
 * without this a large option is serialized on every change to the form data -- and twice over, since the schema it is
 * then scored by derives an `$id` of its own. The relaxed form depends on nothing but the option, and an option is
 * read rather than written wherever it is scored, so an entry stays the relaxation of what it is keyed by.
 *
 * It is keyed by the option as resolution leaves it rather than as the caller declared it, since that is what the
 * relaxation is of, so a call that resolves a `$ref` hands over a new object and misses: an option that is a `$ref`
 * is relaxed once per call. Keying by the declared option instead would hit, but the relaxation of a `$ref` depends
 * on the `rootSchema` it resolves against, which the key would not carry
 */
const relaxedOptions = new WeakMap<StrictRJSFSchema, StrictRJSFSchema>();

/** Normalises a list of `oneOf`/`anyOf` options for use in option-scoring only (not for filtering).
 * Boolean schemas are converted to their object equivalents (`true` → `{}`, `false` → `{not:{}}`).
 * When `resolveRefs` is `true`, each object option is first passed through `resolveAllReferences`
 * so that `$ref`-based options expose their `additionalProperties` constraint before relaxation.
 * Any option whose `additionalProperties` is `false` is widened to `true` so that
 * `getClosestMatchingOption` / `validator.isValid()` does not produce false negatives when the
 * form data contains keys not listed in `properties`.
 *
 * @param options - The raw `oneOf`/`anyOf` array, which may contain boolean schemas
 * @param [resolveRefs=false] - When `true`, resolve `$ref`s in each option before relaxing; pass
 *   `rootSchema` as well. Set `false` (default) when refs are already resolved at the call site.
 * @param [rootSchema] - Required when `resolveRefs` is `true`; the root schema used to look up `$ref`s
 * @returns - A new array of plain schema objects with `additionalProperties` relaxed where needed
 */
export function relaxOptionsForScoring<S extends StrictRJSFSchema = RJSFSchema>(
  options: (S | boolean)[],
  resolveRefs = false,
  rootSchema?: S,
): S[] {
  return options.map((d) => {
    if (!isObject(d)) {
      return normalizeBooleanSchema<S>(d);
    }
    const schema = resolveRefs && rootSchema ? resolveAllReferences<S>(d, rootSchema, []) : d;
    if (schema.additionalProperties !== false) {
      return schema;
    }
    const memoized = relaxedOptions.get(schema);
    if (memoized) {
      return memoized as S;
    }
    // Relaxing makes a schema the option's `$id` does not name, so it is derived for the same reason
    // `getFirstMatchingOption()` derives one for the schema it augments
    const relaxed = withVariantId<S>({ ...schema, additionalProperties: true });
    relaxedOptions.set(schema, relaxed);
    return relaxed;
  });
}

/** Resolves dependencies within a schema and its 'anyOf/oneOf' children. Passes the `expandAllBranches` flag down to
 * the `resolveAnyOrOneOfSchema()` and `processDependencies()` helper calls.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a dependency is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - The list of schemas with their dependencies resolved
 */
export function resolveDependencies<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  passCount = 0,
): S[] {
  // Drop the dependencies from the source schema.
  const { dependencies, ...remainingSchema } = schema;
  const resolvedSchemas = resolveAnyOrOneOfSchemas<T, S, F>(
    context,
    remainingSchema as S,
    rootSchema,
    expandAllBranches,
    formData,
    recurseList,
  );
  return resolvedSchemas.flatMap((resolvedSchema) => {
    const applied = processDependencies<T, S, F>(
      context,
      dependencies,
      resolvedSchema,
      rootSchema,
      expandAllBranches,
      recurseList,
      formData,
      passCount,
    );
    // A dependency whose key the form data does not have is left unapplied, so a form renders -- and scores its
    // options against -- the schema with whichever subset of them the data has filled in, where expanding returns
    // only the one with all of them applied. The subsets in between are expanded here, and the empty one below
    if (!expandAllBranches || applied.some((appliedSchema) => deepEquals(appliedSchema, resolvedSchema))) {
      return applied;
    }
    return [
      ...applied,
      ...partiallyApplied<T, S, F>(context, dependencies, resolvedSchema, rootSchema, recurseList, formData, passCount),
      resolvedSchema,
    ];
  });
}

/** The most schema `dependencies` one schema may have for every subset of them to be expanded. There are `2 ** k`
 * of those and each one resolves the schema afresh, so the count doubles with every key added
 */
const MAX_COMBINED_SCHEMA_DEPENDENCIES = 8;

/** Returns the `resolvedSchema` with each proper, non-empty subset of its schema `dependencies` applied. A form
 * applies a dependency once its key has a value, so a user part-way through filling an object in renders it with some
 * of them applied, and that is the schema its options are scored against -- a precompiled validator with only the
 * none- and all-applied forms throws `No precompiled validator function was found for the given schema` on the
 * keystroke that fills the first one in.
 *
 * Only the dependencies holding a schema are varied. A dependency holding a list of names adds them to `required`,
 * which scoring drops, so it describes nothing a validator has to have compiled.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param dependencies - The `dependencies` of the schema being resolved
 * @param resolvedSchema - The schema the dependencies are applied to, with none of them applied
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param recurseList - The list of recursive references already processed
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - The schema with each proper, non-empty subset of its schema dependencies applied
 */
function partiallyApplied<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  dependencies: S['dependencies'],
  resolvedSchema: S,
  rootSchema: S,
  recurseList: string[],
  formData?: T,
  passCount = 0,
): S[] {
  // Iterated rather than read through a default, since this is only reached for a schema that has `dependencies` and
  // a default for the one it cannot have would be a branch no test can take
  const schemaKeys: string[] = [];
  for (const key in dependencies) {
    if (isObject(dependencies[key])) {
      schemaKeys.push(key);
    }
  }
  if (schemaKeys.length < 2) {
    return [];
  }
  const subsets = combinationsUpTo(schemaKeys, MAX_COMBINED_SCHEMA_DEPENDENCIES, () =>
    // The keys are named so that a second schema over the limit is reported rather than deduped into the first one's
    // warning, which says nothing that tells the two apart
    logOnce(
      `A schema has ${schemaKeys.length} schema dependencies, more than the ${MAX_COMBINED_SCHEMA_DEPENDENCIES} whose subsets can all be expanded, so only each dependency alone and all of them together were expanded. A form applies the subset whose keys the data has filled in, so a form part-way between those has no compiled validator. Give the object fewer schema dependencies, nesting what they describe if need be. The keys are: ${schemaKeys.join(', ')}`,
      'warn',
    ),
  );
  return subsets
    .filter((subset) => subset.length < schemaKeys.length)
    .flatMap((subset) => {
      const partial = { ...dependencies } as Record<string, unknown>;
      for (const key of schemaKeys) {
        if (!subset.includes(key)) {
          delete partial[key];
        }
      }
      return processDependencies<T, S, F>(
        context,
        partial as S['dependencies'],
        resolvedSchema,
        rootSchema,
        true,
        recurseList,
        formData,
        passCount,
      );
    });
}

/** Processes all the `dependencies` recursively into the list of `resolvedSchema`s as needed. Passes the
 * `expandAllBranches` flag down to the `withDependentSchema()` and the recursive `processDependencies()` helper calls.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param dependencies - The set of dependencies that needs to be processed
 * @param resolvedSchema - The schema for which processing dependencies is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - The schema with the `dependencies` resolved into it
 */
export function processDependencies<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  dependencies: S['dependencies'],
  resolvedSchema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  passCount = 0,
): S[] {
  let schemas = [resolvedSchema];
  // Process dependencies updating the local schema properties as appropriate.
  for (const dependencyKey in dependencies) {
    if (
      (expandAllBranches || getByPath(formData, dependencyKey) !== undefined) &&
      (!resolvedSchema.properties || dependencyKey in resolvedSchema.properties)
    ) {
      const [remainingDependencies, dependencyValue] = splitKeyElementFromObject(dependencyKey, dependencies);
      if (Array.isArray(dependencyValue)) {
        schemas[0] = withDependentProperties<S>(resolvedSchema, dependencyValue);
      } else if (isObject(dependencyValue)) {
        schemas = withDependentSchema<T, S, F>(
          context,
          resolvedSchema,
          rootSchema,
          dependencyKey,
          dependencyValue as S,
          expandAllBranches,
          recurseList,
          formData,
          passCount,
        );
      }
      return schemas.flatMap((schema) =>
        processDependencies<T, S, F>(
          context,
          remainingDependencies,
          schema,
          rootSchema,
          expandAllBranches,
          recurseList,
          formData,
          passCount,
        ),
      );
    }
  }
  return schemas;
}

/** Updates a schema with additionally required properties added
 *
 * @param schema - The schema for which resolving a dependent properties is desired
 * @param [additionallyRequired] - An optional array of additionally required names
 * @returns - The schema with the additional required values merged in
 */
export function withDependentProperties<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  additionallyRequired?: string[],
) {
  if (!additionallyRequired) {
    return schema;
  }
  const required = Array.isArray(schema.required)
    ? Array.from(new Set([...schema.required, ...additionallyRequired]))
    : additionallyRequired;
  return { ...schema, required };
}

/** Merges a dependent schema into the `schema` dealing with oneOfs and references. Passes the `expandAllBranches` flag
 * down to the `retrieveSchemaInternal()`, `resolveReference()` and `withExactlyOneSubschema()` helper calls.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a dependent schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param dependencyKey - The key name of the dependency
 * @param dependencyValue - The potentially dependent schema
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData]- The current formData to assist retrieving a schema
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - The list of schemas with the dependent schema resolved into them
 */
export function withDependentSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  dependencyKey: string,
  dependencyValue: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  passCount = 0,
): S[] {
  const dependentSchemas = retrieveSchemaInternal<T, S, F>(
    context,
    dependencyValue,
    rootSchema,
    formData,
    expandAllBranches,
    enclosingRefPath(schema, recurseList, passCount),
    undefined,
    undefined,
    passCount > 0 ? 1 : 0,
  );
  return dependentSchemas.flatMap((dependent) => {
    const { oneOf, ...dependentSchema } = dependent;
    const mergedSchema = mergeSchemas(schema, dependentSchema) as S;
    // Since it does not contain oneOf, we return the original schema.
    if (oneOf === undefined) {
      return mergedSchema;
    }
    // Resolve $refs inside oneOf. Branches are resolved against the caller's path plus the enclosing ref, if
    // any; nothing here mutates the path.
    const resolvedOneOfs = oneOf.map((subschema) => {
      if (typeof subschema === 'boolean' || !(REF_KEY in subschema)) {
        return [subschema as S];
      }
      return resolveReference<T, S, F>(
        context,
        subschema as S,
        rootSchema,
        expandAllBranches,
        enclosingRefPath(schema, recurseList, passCount),
        formData,
        undefined,
        undefined,
        passCount > 0 ? 1 : 0,
      );
    });
    const allPermutations = getAllPermutationsOfXxxOf(resolvedOneOfs);
    return allPermutations.flatMap((resolvedOneOf) =>
      withExactlyOneSubschema<T, S, F>(
        context,
        mergedSchema,
        rootSchema,
        dependencyKey,
        resolvedOneOf,
        expandAllBranches,
        recurseList,
        formData,
        passCount,
      ),
    );
  });
}

/** Returns a list of `schema`s with the best choice from the `oneOf` options merged into it. If `expandAllBranches` is
 * true, then a list of schemas for ALL options are retrieved and returned. Passes the `expandAllBranches` flag down to
 * the `retrieveSchemaInternal()` helper call.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a oneOf subschema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param dependencyKey - The key name of the oneOf dependency
 * @param oneOf - The list of schemas representing the oneOf options
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData to assist retrieving a schema
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - Either an array containing the best matching option or all options if `expandAllBranches` is true
 */
export function withExactlyOneSubschema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  dependencyKey: string,
  oneOf: S['oneOf'],
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  passCount = 0,
): S[] {
  const validSubschemas = oneOf!.filter((subschema) => {
    if (typeof subschema === 'boolean' || !subschema?.properties) {
      return false;
    }
    const { [dependencyKey]: conditionPropertySchema } = subschema.properties;
    if (conditionPropertySchema) {
      const conditionSchema: S = {
        type: 'object',
        properties: {
          [dependencyKey]: conditionPropertySchema,
        },
      } as S;
      return context.validator.isValid(conditionSchema, formData, rootSchema) || expandAllBranches;
    }
    return false;
  });

  // Expanding all branches keeps every subschema that names the dependency key, but a `oneOf` whose options all leave
  // it out qualifies none of them, and the rest of this function describes a chosen subschema
  if (validSubschemas.length === 0 || (!expandAllBranches && validSubschemas.length !== 1)) {
    logOnce(
      `ignoring oneOf in dependencies of "${dependencyKey}" because there isn't exactly one subschema that is valid`,
    );
    return [schema];
  }
  return validSubschemas.flatMap((s) => {
    const subschema: S = s as S;
    const [dependentSubschema] = splitKeyElementFromObject(dependencyKey, subschema.properties as GenericObjectType);
    const dependentSchema = { ...subschema, properties: dependentSubschema };
    const schemas = retrieveSchemaInternal<T, S, F>(
      context,
      dependentSchema,
      rootSchema,
      formData,
      expandAllBranches,
      enclosingRefPath(schema, recurseList, passCount),
      undefined,
      undefined,
      passCount > 0 ? 1 : 0,
    );
    return schemas.map((resolvedSubschema) => mergeSchemas(schema, resolvedSubschema) as S);
  });
}
