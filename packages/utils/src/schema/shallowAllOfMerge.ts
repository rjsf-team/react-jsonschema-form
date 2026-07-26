import { createComparator, createMerger, createShallowAllOfMerge } from '@x0k/json-schema-merge';
import { createDeduplicator, createIntersector } from '@x0k/json-schema-merge/lib/array';

import type { Experimental_CustomMergeAllOf, RJSFSchema, StrictRJSFSchema } from '../types';

const { compareSchemaDefinitions, compareSchemaValues } = createComparator();
const { mergeArrayOfSchemaDefinitions } = createMerger({
  intersectJson: createIntersector(compareSchemaValues),
  deduplicateJsonSchemaDef: createDeduplicator(compareSchemaDefinitions),
});

/** Shared `@x0k/json-schema-merge` shallow-allOf merge function used by `mergeAllOfSchema`. Constructed
 * once from a single comparator/merger/intersector/deduplicator pipeline so both consumers share the
 * same configuration without duplicating setup code.
 *
 * Usage: pass a schema that contains an `allOf` keyword and receive the merged result.
 *
 * @example
 * const merged = shallowAllOfMerge(schema); // schema.allOf is merged into the parent schema
 */
const shallowAllOfMerge = createShallowAllOfMerge(mergeArrayOfSchemaDefinitions);

/** Merges a schema's `allOf` array into itself, delegating to `experimental_customMergeAllOf` when
 * provided or to the shared `shallowAllOfMerge` otherwise. Used by both `retrieveSchema` (to decide what
 * to render) and `omitExtraData` (to decide what submitted data to keep).
 *
 * `additionalProperties` only ever considers a schema's own `properties`/`patternProperties`, never its
 * allOf siblings, so the shared merge silently drops any property introduced by an allOf branch (e.g. a
 * resolved `if`/`then`/`else` result) whenever `schema` has `additionalProperties: false`. To keep those
 * properties, `additionalProperties` is temporarily widened to `true` for the merge and the original
 * value is restored on the merged result -- `resolvedSchema` is only ever assigned the fully
 * widened-merged-restored value, never an intermediate one, so a throw from the merge leaves the
 * caller's schema untouched instead of stuck in the widened state. The widen/restore is skipped
 * entirely when a custom merge function is supplied, since that caller owns the merge semantics.
 *
 * @param schema - A schema containing an `allOf` array to be merged
 * @param [experimental_customMergeAllOf] - Optional custom merge function; see `Form` documentation
 * @returns - The merged schema with `allOf` resolved into a single schema object
 */
export function mergeAllOfSchema<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
): S {
  if (experimental_customMergeAllOf) {
    return experimental_customMergeAllOf(schema);
  }
  const hadFalseAdditionalProperties = schema.additionalProperties === false;
  const schemaToMerge = hadFalseAdditionalProperties ? { ...schema, additionalProperties: true } : schema;
  const merged = shallowAllOfMerge(schemaToMerge) as S;
  return hadFalseAdditionalProperties ? { ...merged, additionalProperties: false } : merged;
}
