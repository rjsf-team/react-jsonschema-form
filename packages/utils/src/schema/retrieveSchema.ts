import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
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
import guessType from '../guessType.ts';
import isObject from '../isObject.ts';
import mergeSchemas from '../mergeSchemas.ts';
import { getByPath } from '../pathUtils.ts';
import type {
  Experimental_CustomMergeAllOf,
  FormContextType,
  GenericObjectType,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from '../types.ts';
import getFirstMatchingOption from './getFirstMatchingOption.ts';
import shallowAllOfMerge from './shallowAllOfMerge.ts';

// Backstop for the resolveReference <-> retrieveSchemaInternal loop: with the path reconstructed from RJSF_REF_KEY
// markers a pass over an already-resolved schema is a no-op, so a resolution that still changes after this many
// passes over a single schema is not terminating; it collapses to the schema resolved so far, flagged as a cycle,
// instead of overflowing the stack. The count is local to one fixpoint loop: nested allOf, then/else and
// dependencies branches receive only the caller's re-walk status, so nesting depth alone cannot reach this limit.
const MAX_RESOLUTION_PASSES = 100;

/** Retrieves an expanded schema that has had all of its conditions, additional properties, references and dependencies
 * resolved and merged into the `schema` given a `validator`, `rootSchema` and `rawFormData` that is used to do the
 * potentially recursive resolution.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param [rootSchema={}] - The root schema that will be forwarded to all the APIs
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [resolveAnyOfOrOneOfRefs = false] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @returns - The schema having its conditions, additional properties, references and dependencies resolved
 */
export default function retrieveSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S = {} as S,
  rawFormData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  resolveAnyOfOrOneOfRefs = false,
): S {
  return retrieveSchemaInternal<T, S, F>(
    validator,
    schema,
    rootSchema,
    rawFormData,
    undefined,
    undefined,
    experimental_customMergeAllOf,
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
 * @param validator - An implementation of the `ValidatorType` interface that is used to detect valid schema conditions
 * @param schema - The schema for which resolving a condition is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and
 *          dependencies as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [preserveDependencies=false] - Leave dependencies unresolved for default computation
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - A list of schemas with the appropriate conditions resolved, possibly with all branches expanded
 */
export function resolveCondition<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  preserveDependencies = false,
  passCount = 0,
): S[] {
  const { if: expression, then, else: otherwise, ...resolvedSchemaLessConditional } = schema;

  const conditionValue = validator.isValid(expression as S, formData || ({} as T), rootSchema);
  let resolvedSchemas = [resolvedSchemaLessConditional as S];
  let schemas: S[] = [];
  if (expandAllBranches) {
    if (then && typeof then !== 'boolean') {
      const thenSchema = then as unknown as S;
      schemas = schemas.concat(
        retrieveSchemaInternal<T, S, F>(
          validator,
          thenSchema,
          rootSchema,
          formData,
          expandAllBranches,
          enclosingRefPath(schema, recurseList, passCount),
          experimental_customMergeAllOf,
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
          validator,
          otherwiseSchema,
          rootSchema,
          formData,
          expandAllBranches,
          enclosingRefPath(schema, recurseList, passCount),
          experimental_customMergeAllOf,
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
          validator,
          conditionalSchema,
          rootSchema,
          formData,
          expandAllBranches,
          enclosingRefPath(schema, recurseList, passCount),
          experimental_customMergeAllOf,
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
      validator,
      s,
      rootSchema,
      formData,
      expandAllBranches,
      recurseList,
      experimental_customMergeAllOf,
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
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [resolveAnyOfOrOneOfRefs] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @param [preserveDependencies=false] - Leave dependencies unresolved for default computation
 * @param [passCount=0] - Internal backstop counting the passes of the resolveReference fixpoint loop; resolution
 *          collapses to the schema resolved so far, flagged as a cycle, if it does not converge
 * @returns - The list of schemas having its references, dependencies and allOf schemas resolved
 */
export function resolveSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  resolveAnyOfOrOneOfRefs?: boolean,
  preserveDependencies = false,
  passCount = 0,
): S[] {
  const updatedSchemas = resolveReference<T, S, F>(
    validator,
    schema,
    rootSchema,
    expandAllBranches,
    recurseList,
    formData,
    experimental_customMergeAllOf,
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
      validator,
      schema,
      rootSchema,
      expandAllBranches,
      recurseList,
      formData,
      experimental_customMergeAllOf,
      passCount,
    );
    // The merged result is re-walked so refs introduced by the merge are resolved too. The re-walk runs as a
    // follow-up pass (passCount + 1), so refs that were already expanded keep their fixpoint depth and a $ref
    // already flagged as a cycle stays collapsed.
    return resolvedSchemas.flatMap((s) =>
      retrieveSchemaInternal<T, S, F>(
        validator,
        s,
        rootSchema,
        formData,
        expandAllBranches,
        recurseList,
        experimental_customMergeAllOf,
        undefined,
        undefined,
        passCount + 1,
      ),
    );
  }
  if (ALL_OF_KEY in schema && Array.isArray(schema[ALL_OF_KEY])) {
    const allOfSchemaElements: S[][] = schema.allOf.map((allOfSubschema) =>
      retrieveSchemaInternal<T, S, F>(
        validator,
        allOfSubschema as S,
        rootSchema,
        formData,
        expandAllBranches,
        enclosingRefPath(schema, recurseList, passCount),
        experimental_customMergeAllOf,
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
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a reference is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of $refs already expanded on the current resolution path, used to detect cycles
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [resolveAnyOfOrOneOfRefs] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @param [preserveDependencies=false] - Leave dependencies unresolved for default computation
 * @param [passCount=0] - Internal backstop counting the passes of the fixpoint loop; resolution collapses to the
 *          schema resolved so far, flagged as a cycle, if it does not converge
 * @returns - The list schemas retrieved after having all references resolved
 */
export function resolveReference<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  resolveAnyOfOrOneOfRefs?: boolean,
  preserveDependencies = false,
  passCount = 0,
): S[] {
  if (passCount > MAX_RESOLUTION_PASSES) {
    // Backstop: termination is structural (see below), so reaching this many passes means a regression broke the
    // fixpoint. Collapse to the schema resolved so far, flagged as a cycle, instead of throwing during render:
    // `SchemaField` renders a cycle indicator for it, the way it does for other detected cycles.
    return [{ ...schema, [RJSF_REF_CYCLE_KEY]: true } as S];
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
      validator,
      updatedSchema,
      rootSchema,
      formData,
      expandAllBranches,
      recurseList,
      experimental_customMergeAllOf,
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
      return markCycleOnDetection ? ({ ...resolvedSchema, [RJSF_REF_CYCLE_KEY]: true } as S) : resolvedSchema;
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
    let key: 'anyOf' | 'oneOf' | undefined;
    let schemas: S[] | undefined;
    if (ANY_OF_KEY in schema && Array.isArray(schema[ANY_OF_KEY])) {
      key = ANY_OF_KEY;
      schemas = resolvedSchema[ANY_OF_KEY] as S[];
    } else if (ONE_OF_KEY in schema && Array.isArray(schema[ONE_OF_KEY])) {
      key = ONE_OF_KEY;
      schemas = resolvedSchema[ONE_OF_KEY] as S[];
    }
    if (key && schemas) {
      // Options are resolved in order, and refs materialized by one option stay on the path for the options after
      // it: an option that reuses a ref an earlier option already expanded collapses to the unexpanded skeleton.
      // This keeps the materialized result linear on DAGs of shared refs (two identical `$ref` options do not each
      // materialize the whole subgraph) while the path scoping above still prevents the expansion from leaking
      // into sibling subtrees.
      let optionsPath = pathList;
      resolvedSchema = {
        ...resolvedSchema,
        [key]: schemas.map((s: S) => {
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

/** Creates new 'properties' items for each key in the `formData`
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param theSchema - The schema for which the existing additional properties is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s * @param validator
 * @param [aFormData] - The current formData, if any, to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @returns - The updated schema with additional properties stubbed
 */
export function stubExistingAdditionalProperties<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  theSchema: S,
  rootSchema?: S,
  aFormData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
): S {
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
          validator,
          { [ALL_OF_KEY]: Object.values(matchingProperties) } as S,
          rootSchema,
          formData[key],
          experimental_customMergeAllOf,
        );
        (schema.properties[key] as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
        return;
      }
    }
    if (ADDITIONAL_PROPERTIES_KEY in schema && schema.additionalProperties !== false) {
      let additionalProperties: S['additionalProperties'];
      if (typeof schema.additionalProperties !== 'boolean') {
        if (REF_KEY in schema.additionalProperties!) {
          additionalProperties = retrieveSchema<T, S, F>(
            validator,
            { [REF_KEY]: (schema.additionalProperties as S)[REF_KEY] } as S,
            rootSchema,
            formData[key],
            experimental_customMergeAllOf,
          );
        } else if ('type' in schema.additionalProperties!) {
          additionalProperties = { ...schema.additionalProperties };
        } else if (ANY_OF_KEY in schema.additionalProperties! || ONE_OF_KEY in schema.additionalProperties!) {
          additionalProperties = {
            type: 'object',
            ...schema.additionalProperties,
          };
        } else {
          additionalProperties = { type: guessType(formData[key]) };
        }
      } else {
        additionalProperties = { type: guessType(formData[key]) };
      }

      // The type of our new key should match the additionalProperties value;
      schema.properties[key] = additionalProperties;
      // Set our additional property flag so we know it was dynamically added
      (schema.properties[key] as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
    } else {
      // Invalid property
      schema.properties[key] = { type: 'null' };
      // Set our additional property flag so we know it was dynamically added
      (schema.properties[key] as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
    }
  });

  return schema;
}

/**
 * Internal helper that merges allOf schemas using @x0k/json-schema-merge's shallow allOf merge
 * @param schema - The schema containing an `allOf` keyword
 * @returns The schema with allOf schemas merged
 */
function mergeAllOf<S extends StrictRJSFSchema = RJSFSchema>(schema: S): S {
  return shallowAllOfMerge(schema) as S;
}

/** Internal handler that retrieves an expanded schema that has had all of its conditions, additional properties,
 * references and dependencies resolved and merged into the `schema` given a `validator`, `rootSchema` and `rawFormData`
 * that is used to do the potentially recursive resolution. If `expandAllBranches` is true, then all possible branches
 * of the schema and its references, conditions and dependencies are returned.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema
 * @param [expandAllBranches=false] - Flag, if true, will return all possible branches of conditions, any/oneOf and
 *          dependencies as a list of schemas
 * @param [recurseList=[]] - The list of refs already expanded on the current resolution path, used to detect
 *          cycles; callers should omit this
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [resolveAnyOfOrOneOfRefs] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
 * @param [preserveDependencies=false] - Leave dependencies unresolved for default computation
 * @param [passCount=0] - Internal backstop counting the passes of the `resolveReference` fixpoint loop;
 *          resolution collapses to the schema resolved so far, flagged as a cycle, if a schema ever stops
 *          terminating. Callers should omit this
 * @returns - The schema(s) resulting from having its conditions, additional properties, references and dependencies
 *          resolved. Multiple schemas may be returned if `expandAllBranches` is true.
 */
export function retrieveSchemaInternal<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S,
  rawFormData?: T,
  expandAllBranches = false,
  recurseList: string[] = [],
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  resolveAnyOfOrOneOfRefs?: boolean,
  preserveDependencies = false,
  passCount = 0,
): S[] {
  if (!isObject(schema)) {
    return [{} as S];
  }
  const resolvedSchemas = resolveSchema<T, S, F>(
    validator,
    schema,
    rootSchema,
    expandAllBranches,
    recurseList,
    rawFormData,
    experimental_customMergeAllOf,
    resolveAnyOfOrOneOfRefs,
    preserveDependencies,
    passCount,
  );
  return resolvedSchemas.flatMap((s: S) => {
    let resolvedSchema = s;
    if (IF_KEY in resolvedSchema) {
      return resolveCondition<T, S, F>(
        validator,
        resolvedSchema,
        rootSchema,
        expandAllBranches,
        recurseList,
        rawFormData as T,
        experimental_customMergeAllOf,
        preserveDependencies,
        passCount,
      );
    }
    if (ALL_OF_KEY in resolvedSchema) {
      // resolve allOf schemas
      if (expandAllBranches) {
        const { allOf, ...restOfSchema } = resolvedSchema;
        return [...(allOf as S[]), restOfSchema as S];
      }
      try {
        resolvedSchema = experimental_customMergeAllOf
          ? experimental_customMergeAllOf(resolvedSchema)
          : mergeAllOf(resolvedSchema);
      } catch (e) {
        // oxlint-disable-next-line no-console
        console.warn('could not merge subschemas in allOf:\n', e);
        const { allOf, ...resolvedSchemaWithoutAllOf } = resolvedSchema;
        return resolvedSchemaWithoutAllOf as S;
      }
    }
    if (PROPERTIES_KEY in resolvedSchema && PATTERN_PROPERTIES_KEY in resolvedSchema) {
      resolvedSchema = Object.keys(resolvedSchema.properties!).reduce(
        (acc, key) => {
          const matchingProperties = getMatchingPatternProperties(acc, key);
          if (Object.keys(matchingProperties).length > 0) {
            [acc.properties[key]] = retrieveSchemaInternal<T, S, F>(
              validator,
              { allOf: [acc.properties[key], ...Object.values(matchingProperties)] } as S,
              rootSchema,
              getByPath<T>(rawFormData, key),
              undefined,
              undefined,
              experimental_customMergeAllOf,
              undefined,
              preserveDependencies,
            );
          }
          return acc;
        },
        {
          ...resolvedSchema,
          properties: { ...resolvedSchema.properties },
        },
      );
    }
    const hasAdditionalProperties =
      PATTERN_PROPERTIES_KEY in resolvedSchema ||
      (ADDITIONAL_PROPERTIES_KEY in resolvedSchema && resolvedSchema.additionalProperties !== false);
    if (hasAdditionalProperties) {
      return stubExistingAdditionalProperties<T, S, F>(
        validator,
        resolvedSchema,
        rootSchema,
        rawFormData as T,
        experimental_customMergeAllOf,
      );
    }

    return resolvedSchema;
  });
}

/** Resolves an `anyOf` or `oneOf` within a schema (if present) to the list of schemas returned from
 * `retrieveSchemaInternal()` for the best matching option. If `expandAllBranches` is true, then a list of schemas for ALL
 * options are retrieved and returned.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema, defaults to an empty object
 * @returns - Either an array containing the best matching option or all options if `expandAllBranches` is true
 */
export function resolveAnyOrOneOfSchemas<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(validator: ValidatorType<T, S, F>, schema: S, rootSchema: S, expandAllBranches: boolean, rawFormData?: T) {
  let anyOrOneOf: S[] | undefined;
  const { oneOf, anyOf, ...remaining } = schema;
  if (Array.isArray(oneOf)) {
    anyOrOneOf = oneOf as S[];
  } else if (Array.isArray(anyOf)) {
    anyOrOneOf = anyOf as S[];
  }
  if (anyOrOneOf) {
    // Ensure that during expand all branches we pass an object rather than undefined so that all options are interrogated
    const formData = rawFormData === undefined && expandAllBranches ? ({} as T) : rawFormData;
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    anyOrOneOf = anyOrOneOf.map((s) => resolveAllReferences(s, rootSchema, []));
    // Call this to trigger the set of isValid() calls that the schema parser will need
    const option = getFirstMatchingOption<T, S, F>(validator, formData, anyOrOneOf, rootSchema, discriminator);
    if (expandAllBranches) {
      // Also trigger isValid() for the relaxed variants so that precompiled validators capture their hashes.
      // omitExtraData's handleOneOf relaxes additionalProperties:false → true before scoring; those mutated
      // schemas must be present in a precompiled validator's compiled set or isValid() will throw at runtime.
      // Using getFirstMatchingOption (rather than calling isValid directly) ensures that the augmented forms
      // of each option (as constructed internally by getFirstMatchingOption for options with properties) are
      // also captured. The return value is discarded — the call is purely for ParserValidator's side effect.
      const relaxed = relaxOptionsForScoring<S>(anyOrOneOf, false, rootSchema);
      getFirstMatchingOption<T, S, F>(validator, formData, relaxed, rootSchema, discriminator);
      return anyOrOneOf.map((item) => mergeSchemas(remaining, item) as S);
    }
    return [mergeSchemas(remaining, anyOrOneOf[option]) as S];
  }
  return [schema];
}

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
    return schema.additionalProperties === false ? { ...schema, additionalProperties: true } : schema;
  });
}

/** Resolves dependencies within a schema and its 'anyOf/oneOf' children. Passes the `expandAllBranches` flag down to
 * the `resolveAnyOrOneOfSchema()` and `processDependencies()` helper calls.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a dependency is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - The list of schemas with their dependencies resolved
 */
export function resolveDependencies<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  passCount = 0,
): S[] {
  // Drop the dependencies from the source schema.
  const { dependencies, ...remainingSchema } = schema;
  const resolvedSchemas = resolveAnyOrOneOfSchemas<T, S, F>(
    validator,
    remainingSchema as S,
    rootSchema,
    expandAllBranches,
    formData,
  );
  return resolvedSchemas.flatMap((resolvedSchema) =>
    processDependencies<T, S, F>(
      validator,
      dependencies,
      resolvedSchema,
      rootSchema,
      expandAllBranches,
      recurseList,
      formData,
      experimental_customMergeAllOf,
      passCount,
    ),
  );
}

/** Processes all the `dependencies` recursively into the list of `resolvedSchema`s as needed. Passes the
 * `expandAllBranches` flag down to the `withDependentSchema()` and the recursive `processDependencies()` helper calls.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param dependencies - The set of dependencies that needs to be processed
 * @param resolvedSchema - The schema for which processing dependencies is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - The schema with the `dependencies` resolved into it
 */
export function processDependencies<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  dependencies: S['dependencies'],
  resolvedSchema: S,
  rootSchema: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  passCount = 0,
): S[] {
  let schemas = [resolvedSchema];
  // Process dependencies updating the local schema properties as appropriate.
  for (const dependencyKey in dependencies) {
    if (
      (expandAllBranches || getByPath(formData, dependencyKey) !== undefined) &&
      (!resolvedSchema.properties || dependencyKey in resolvedSchema.properties)
    ) {
      const [remainingDependencies, dependencyValue] = splitKeyElementFromObject(
        dependencyKey,
        dependencies as GenericObjectType,
      );
      if (Array.isArray(dependencyValue)) {
        schemas[0] = withDependentProperties<S>(resolvedSchema, dependencyValue);
      } else if (isObject(dependencyValue)) {
        schemas = withDependentSchema<T, S, F>(
          validator,
          resolvedSchema,
          rootSchema,
          dependencyKey,
          dependencyValue as S,
          expandAllBranches,
          recurseList,
          formData,
          experimental_customMergeAllOf,
          passCount,
        );
      }
      return schemas.flatMap((schema) =>
        processDependencies<T, S, F>(
          validator,
          remainingDependencies,
          schema,
          rootSchema,
          expandAllBranches,
          recurseList,
          formData,
          experimental_customMergeAllOf,
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
 * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param schema - The schema for which resolving a dependent schema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param dependencyKey - The key name of the dependency
 * @param dependencyValue - The potentially dependent schema
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData]- The current formData to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - The list of schemas with the dependent schema resolved into them
 */
export function withDependentSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S,
  dependencyKey: string,
  dependencyValue: S,
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  passCount = 0,
): S[] {
  const dependentSchemas = retrieveSchemaInternal<T, S, F>(
    validator,
    dependencyValue,
    rootSchema,
    formData,
    expandAllBranches,
    enclosingRefPath(schema, recurseList, passCount),
    experimental_customMergeAllOf,
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
        validator,
        subschema as S,
        rootSchema,
        expandAllBranches,
        enclosingRefPath(schema, recurseList, passCount),
        formData,
        experimental_customMergeAllOf,
        undefined,
        undefined,
        passCount > 0 ? 1 : 0,
      );
    });
    const allPermutations = getAllPermutationsOfXxxOf(resolvedOneOfs);
    return allPermutations.flatMap((resolvedOneOf) =>
      withExactlyOneSubschema<T, S, F>(
        validator,
        mergedSchema,
        rootSchema,
        dependencyKey,
        resolvedOneOf,
        expandAllBranches,
        recurseList,
        formData,
        experimental_customMergeAllOf,
        passCount,
      ),
    );
  });
}

/** Returns a list of `schema`s with the best choice from the `oneOf` options merged into it. If `expandAllBranches` is
 * true, then a list of schemas for ALL options are retrieved and returned. Passes the `expandAllBranches` flag down to
 * the `retrieveSchemaInternal()` helper call.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used to validate oneOf options
 * @param schema - The schema for which resolving a oneOf subschema is desired
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param dependencyKey - The key name of the oneOf dependency
 * @param oneOf - The list of schemas representing the oneOf options
 * @param expandAllBranches - Flag, if true, will return all possible branches of conditions, any/oneOf and dependencies
 *          as a list of schemas
 * @param recurseList - The list of refs already expanded on the current resolution path, used to
 *          detect cycles
 * @param [formData] - The current formData to assist retrieving a schema
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [passCount=0] - The pass of the `resolveReference` fixpoint loop this resolution belongs to
 * @returns - Either an array containing the best matching option or all options if `expandAllBranches` is true
 */
export function withExactlyOneSubschema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  rootSchema: S,
  dependencyKey: string,
  oneOf: S['oneOf'],
  expandAllBranches: boolean,
  recurseList: string[],
  formData?: T,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
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
      return validator.isValid(conditionSchema, formData, rootSchema) || expandAllBranches;
    }
    return false;
  });

  if (!expandAllBranches && validSubschemas.length !== 1) {
    // oxlint-disable-next-line no-console
    console.warn("ignoring oneOf in dependencies because there isn't exactly one subschema that is valid");
    return [schema];
  }
  return validSubschemas.flatMap((s) => {
    const subschema: S = s as S;
    const [dependentSubschema] = splitKeyElementFromObject(dependencyKey, subschema.properties as GenericObjectType);
    const dependentSchema = { ...subschema, properties: dependentSubschema };
    const schemas = retrieveSchemaInternal<T, S, F>(
      validator,
      dependentSchema,
      rootSchema,
      formData,
      expandAllBranches,
      enclosingRefPath(schema, recurseList, passCount),
      experimental_customMergeAllOf,
      undefined,
      undefined,
      passCount > 0 ? 1 : 0,
    );
    return schemas.map((resolvedSubschema) => mergeSchemas(schema, resolvedSubschema) as S);
  });
}
