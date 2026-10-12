import { ALL_OF_KEY, DEPENDENCIES_KEY, ELSE_KEY, REF_KEY, RJSF_REF_KEY, THEN_KEY } from './constants.ts';
import type { RJSFMarkedSchema, RJSFSchema, StrictRJSFSchema } from './types.ts';

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

/** Marks a schema resolved from a `$ref` that had branch keywords beside it with the names of those keywords. The
 * resolved schema holds the definition's keywords and the ones from beside the `$ref` alike, and only this tells them
 * apart. It is exported for this package alone, which sets it in `resolvedSchemaOf()` and reads it in
 * `enclosingRefPath()`.
 */
export const REF_SIBLING_BRANCHES = Symbol('__rjsf_ref_sibling_branches');

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
  const siblingBranches = BRANCH_KEYWORDS.filter((keyword) => keyword in siblings);
  return {
    ...definition,
    ...siblings,
    [RJSF_REF_KEY]: ref,
    ...(siblingBranches.length > 0 && { [REF_SIBLING_BRANCHES]: siblingBranches }),
  };
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
  const siblingBranches: unknown = Reflect.get(schema, REF_SIBLING_BRANCHES);
  return Array.isArray(siblingBranches) && siblingBranches.includes(keyword)
    ? recurseList
    : [...recurseList, sourceRef];
}
