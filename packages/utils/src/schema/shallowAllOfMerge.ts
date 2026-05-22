import { createComparator, createMerger, createShallowAllOfMerge } from '@x0k/json-schema-merge';
import { createDeduplicator, createIntersector } from '@x0k/json-schema-merge/lib/array';

const { compareSchemaDefinitions, compareSchemaValues } = createComparator();
const { mergeArrayOfSchemaDefinitions } = createMerger({
  intersectJson: createIntersector(compareSchemaValues),
  deduplicateJsonSchemaDef: createDeduplicator(compareSchemaDefinitions),
});

/** Shared `@x0k/json-schema-merge` shallow-allOf merge function used by `retrieveSchema` and
 * `omitExtraData`. Constructed once from a single comparator/merger/intersector/deduplicator
 * pipeline so both consumers share the same configuration without duplicating setup code.
 *
 * Usage: pass a schema that contains an `allOf` keyword and receive the merged result.
 *
 * @example
 * const merged = shallowAllOfMerge(schema); // schema.allOf is merged into the parent schema
 */
export default createShallowAllOfMerge(mergeArrayOfSchemaDefinitions);
