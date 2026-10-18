import { withoutStubsDeclaredElsewhere } from './additionalPropertiesUtils.ts';
import {
  ALL_OF_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  REF_KEY,
  RJSF_REF_SIBLING_BRANCHES_KEY,
  RJSF_REF_KEY,
  THEN_KEY,
} from './constants.ts';
import mergeSchemas from './mergeSchemas.ts';
import type { GenericObjectType, RJSFMarkedSchema, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the `$ref` the given `schema` still holds, which is one that has yet to be resolved.
 *
 * @param schema - The schema to read the reference off, if there is one to read it off at all
 * @returns - The `$ref` the schema holds, or undefined when it holds none
 */
export function declaredRef<S extends StrictRJSFSchema = RJSFSchema>(schema: S | undefined): string | undefined {
  return schema?.[REF_KEY];
}

/** Returns the `$ref` that the given `schema` was resolved from, which `resolveAllReferences()` marks it with. A
 * resolved schema no longer holds the reference as a key, so the marker is what names where it came from.
 *
 * @param schema - The schema to read the marker off, if there is one to read it off at all
 * @returns - The `$ref` the schema was resolved from, or undefined when it was not resolved from one
 */
export function resolvedFromRef<S extends StrictRJSFSchema = RJSFSchema>(schema: S | undefined): string | undefined {
  return (schema as RJSFMarkedSchema | undefined)?.[RJSF_REF_KEY] as string | undefined;
}

/** The keywords whose subschemas are resolved as branches, each on a resolution path of its own, which makes them the
 * ones `enclosingRefPath()` is asked about.
 */
const BRANCH_KEYWORDS: string[] = [ALL_OF_KEY, DEPENDENCIES_KEY, ELSE_KEY, THEN_KEY];

/** One frozen list per combination of branch keywords, so that resolving the same `$ref` again marks it with the same
 * value and `replaceEqualDeep()` can keep the earlier resolution.
 */
const siblingBranchLists = new Map<string, readonly string[]>();

function siblingBranchList(siblings: object): readonly string[] | undefined {
  const branches = BRANCH_KEYWORDS.filter((keyword) => Reflect.get(siblings, keyword) !== undefined);
  if (branches.length === 0) {
    return undefined;
  }
  const key = branches.join();
  let list = siblingBranchLists.get(key);
  if (list === undefined) {
    list = Object.freeze(branches);
    siblingBranchLists.set(key, list);
  }
  return list;
}

/** Returns the schema a `$ref` resolves to: the definition it names under the keywords that stood beside it, marked
 * with the reference it was resolved from and with which of its branch keywords were ones beside the `$ref`.
 *
 * @param ref - The `$ref` being resolved
 * @param definition - The schema definition the `$ref` names
 * @param siblings - The keywords that stood beside the `$ref`, which override the definition's
 * @returns - The resolved schema, marked with where it came from
 */
export function resolvedSchemaOf<S extends StrictRJSFSchema = RJSFSchema>(
  ref: string | undefined,
  definition: S,
  siblings: object,
): S {
  const resolved = { ...definition, ...siblings, [RJSF_REF_KEY]: ref };
  // A list the definition or the siblings carry from an earlier resolution is not this reference's
  setOrDelete(resolved, RJSF_REF_SIBLING_BRANCHES_KEY, siblingBranchList(siblings));
  return resolved;
}

function setOrDelete(target: object, marker: symbol, value: unknown) {
  if (value === undefined) {
    Reflect.deleteProperty(target, marker);
  } else {
    Reflect.set(target, marker, value);
  }
}

/** Merges a resolved `branch` of a `schema` into it, keeping the markers that say where `schema` itself was resolved
 * from. `mergeSchemas()` copies the branch's markers over them, and a branch that was a `$ref` would leave the merged
 * schema named after the branch's definition: the next branch would then be resolved on that definition's path
 * rather than on the schema's own. A schema that was not resolved from a reference takes the branch's markers, since
 * a branch that is the `$ref` back to an enclosing definition is how such a schema is known to be inside it. A stub
 * either side holds for a key the other declares is left out of the merge, as `withoutStubsDeclaredElsewhere()` says.
 *
 * @param schema - The schema the branch belongs to
 * @param branch - The resolved branch to merge into it
 * @returns - The merged schema, marked as `schema` is when it is marked at all
 */
export function mergeBranch<S extends StrictRJSFSchema = RJSFSchema>(schema: S, branch: GenericObjectType): S {
  const [own, other] = withoutStubsDeclaredElsewhere([schema, branch as S]);
  const merged = mergeSchemas(own, other) as S;
  const ownRef = resolvedFromRef<S>(schema);
  if (ownRef !== undefined) {
    Reflect.set(merged, RJSF_REF_KEY, ownRef);
    setOrDelete(merged, RJSF_REF_SIBLING_BRANCHES_KEY, refSiblingBranches(schema));
  }
  return merged;
}

/** Returns the branch keywords that stood beside the `$ref` the given `schema` was resolved from, which
 * `resolvedSchemaOf()` marks it with.
 *
 * @param schema - The schema to read the marker off, if it is one that can carry it at all
 * @returns - The branch keywords from beside the `$ref`, or undefined when there were none
 */
export function refSiblingBranches(schema: unknown): unknown[] | undefined {
  if (typeof schema !== 'object' || schema === null || !(RJSF_REF_SIBLING_BRANCHES_KEY in schema)) {
    return undefined;
  }
  const siblingBranches = schema[RJSF_REF_SIBLING_BRANCHES_KEY];
  return Array.isArray(siblingBranches) ? siblingBranches : undefined;
}

/** Returns the resolution path for what a `schema` holds, which is the path `schema` was reached by plus the reference
 * it was itself resolved from. A `$ref` back to that reference from inside the definition is a recursion, and having it
 * on the path is what leaves such a `$ref` collapsed rather than expanded once more on every resolution.
 *
 * A branch `keyword` that stood beside the `$ref` is not part of the definition, so the reference stays off the path of
 * what it holds: a `$ref` to the same definition in there is a second use of it, not a way back into it.
 *
 * @param schema - The schema whose own reference joins the path
 * @param recurseList - The list of refs already expanded on the current resolution path
 * @param [keyword] - The branch keyword of `schema` the path is for, when it is for the subschemas of one
 * @returns - `recurseList` plus the reference `schema` was resolved from, when it carries one that is not on the list
 *          already and that the `keyword` did not stand beside
 */
export function enclosingRefPath<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  recurseList: string[],
  keyword?: string,
): string[] {
  const sourceRef = resolvedFromRef<S>(schema);
  if (sourceRef === undefined || recurseList.includes(sourceRef)) {
    return recurseList;
  }
  return refSiblingBranches(schema)?.includes(keyword) ? recurseList : [...recurseList, sourceRef];
}
