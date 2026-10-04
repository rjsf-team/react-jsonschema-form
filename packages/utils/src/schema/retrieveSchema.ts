import { combinationsUpTo } from '../combinationsOf.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
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
} from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import findSchemaDefinition, { splitKeyElementFromObject } from '../findSchemaDefinition.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
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

/** Returns the subset of 'patternProperties' specifications that match the given 'key'
 *
 * @param schema - The schema whose 'patternProperties' are to be filtered
 * @param key - The key to match against the 'patternProperties' specifications
 * @returns - The subset of 'patternProperties' specifications that match the given 'key'
 */
export function getMatchingPatternProperties<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  key: string,
): Required<S['patternProperties']> {
  const patternProperties = schema.patternProperties ?? {};
  return Object.fromEntries(
    Object.entries(patternProperties).filter(([pattern]) => RegExp(pattern).test(key)),
  ) as Required<S['patternProperties']>;
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
const IDENTIFIER_KEYWORDS: string[] = ['$id', '$anchor', '$dynamicAnchor', '$schema', '$vocabulary'];

/** The keywords that hold other subschemas for a `$ref` to name rather than describe a value. The stub drops the
 * `$ref` that would reach them, so copying them into every property would hand each one an unreachable copy that
 * `hashForSchema()` and `deepEquals()` then walk on every render.
 */
const CONTAINER_KEYWORDS: string[] = ['$defs', 'definitions'];

/** Every keyword that constrains the value, for the reasons the first two lists above give. They are only ever
 * consulted together, and once per property key, so they are consulted as one.
 */
const CONSTRAINING_KEYWORDS = new Set<string>([...VALUE_KEYWORDS, ...SUBSCHEMA_KEYWORDS]);

/** Every keyword the stub leaves out, for the reasons the three lists above give. They are only ever consulted
 * together, and once per property key, so they are consulted as one.
 */
const EXCLUDED_STUB_KEYWORDS = new Set<string>([...SUBSCHEMA_KEYWORDS, ...IDENTIFIER_KEYWORDS, ...CONTAINER_KEYWORDS]);

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
  const schema: GenericObjectType = {};
  let isConstrained = false;
  Object.entries(subSchema).forEach(([key, value]) => {
    if (CONSTRAINING_KEYWORDS.has(key)) {
      isConstrained = true;
    }
    const isForeignDefault = key === 'default' && guessType(value) !== type;
    if (!EXCLUDED_STUB_KEYWORDS.has(key) && !isForeignDefault) {
      schema[key] = value;
    }
  });
  schema.type = type;
  if (!isConstrained) {
    (schema as RJSFMarkedSchema)[GUESSED_TYPE_FLAG] = true;
  }
  return schema as S;
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
  Object.keys(formData).forEach((key) => {
    if (key in schema.properties) {
      // No need to stub, our schema already has the property
      return;
    }
    if (PATTERN_PROPERTIES_KEY in schema) {
      const matchingProperties = getMatchingPatternProperties(schema, key);
      if (Object.keys(matchingProperties).length > 0) {
        schema.properties[key] = retrieveSchema<T, S, F>(
          context,
          { [ALL_OF_KEY]: Object.values(matchingProperties) } as S,
          rootSchema,
          formData[key],
        );
        (schema.properties[key] as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
        return;
      }
    }
    if (schema.additionalProperties !== false) {
      let additionalProperties: S['additionalProperties'];
      if (isObject(schema.additionalProperties)) {
        if (REF_KEY in schema.additionalProperties) {
          additionalProperties = retrieveSchema<T, S, F>(
            context,
            { [REF_KEY]: (schema.additionalProperties as S)[REF_KEY] } as S,
            rootSchema,
            formData[key],
          );
        } else if ('type' in schema.additionalProperties) {
          additionalProperties = { ...schema.additionalProperties };
        } else if (ANY_OF_KEY in schema.additionalProperties || ONE_OF_KEY in schema.additionalProperties) {
          additionalProperties = {
            type: 'object',
            ...schema.additionalProperties,
          };
        } else {
          additionalProperties = guessedTypeSchema<S>(formData[key], schema.additionalProperties as S);
        }
      } else {
        // `additionalProperties: false` is excluded above, so what is left is `true` or no `additionalProperties` at
        // all, which JSON Schema reads as `true`: anything goes, including a key none of the `patternProperties`
        // patterns match, which the schema allows all the same and so gets a field for the data it holds
        additionalProperties = guessedTypeSchema<S>(formData[key]);
      }

      // The type of our new key should match the additionalProperties value;
      schema.properties[key] = additionalProperties;
      // Set our additional property flag so we know it was dynamically added
      (schema.properties[key] as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
    } else {
      // `additionalProperties: false` forbids every key its `patternProperties` don't match, so the property has no
      // subschema of its own to render it with and the schema allows no value for it
      schema.properties[key] = { type: 'null' };
      // Set our additional property flag so we know it was dynamically added
      (schema.properties[key] as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
    }
  });

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
        const matchingProperties = getMatchingPatternProperties(resolvedSchema, key);
        if (Object.keys(matchingProperties).length === 0) {
          return [];
        }
        const property = properties[key];
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
    const hasAdditionalProperties =
      PATTERN_PROPERTIES_KEY in resolvedSchema ||
      (ADDITIONAL_PROPERTIES_KEY in resolvedSchema && resolvedSchema.additionalProperties !== false);
    if (!hasAdditionalProperties) {
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
