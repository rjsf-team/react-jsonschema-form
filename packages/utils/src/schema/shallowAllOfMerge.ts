import { createComparator, createMerger } from '@x0k/json-schema-merge';
import { createDeduplicator, createIntersector } from '@x0k/json-schema-merge/lib/array';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

const { compareSchemaDefinitions, compareSchemaValues } = createComparator();
const { mergeArrayOfSchemaDefinitions } = createMerger({
  intersectJson: createIntersector(compareSchemaValues),
  deduplicateJsonSchemaDef: createDeduplicator(compareSchemaDefinitions),
});

/** Returns `schema` and the entries of its `allOf`, those of theirs included, in the order the merge takes them */
function allOfSchemas(schema: JSONSchema7Definition): JSONSchema7Definition[] {
  if (typeof schema === 'boolean' || schema.allOf === undefined) {
    return [schema];
  }
  const { allOf, ...rest } = schema;
  return [rest, ...allOf.flatMap(allOfSchemas)];
}

/** Returns `schema` with its `prefixItems` and the `items` beside them as the tuple `items` and `additionalItems` of
 * draft-07 they equal, or with `toPrefixItems` the other way round
 */
function swapTupleKeys(schema: JSONSchema7Definition, toPrefixItems = false): JSONSchema7Definition {
  const [tupleKey, restKey, newTupleKey, newRestKey] = toPrefixItems
    ? (['items', 'additionalItems', 'prefixItems', 'items'] as const)
    : (['prefixItems', 'items', 'items', 'additionalItems'] as const);
  if (typeof schema === 'boolean' || !Array.isArray(schema[tupleKey])) {
    return schema;
  }
  const { [tupleKey]: tuple, [restKey]: rest, ...others }: JSONSchema7 = schema;
  return { ...others, [newTupleKey]: tuple, ...(rest !== undefined && { [newRestKey]: rest }) };
}

/** Shared `@x0k/json-schema-merge` shallow-allOf merge function used by `retrieveSchema` and
 * `omitExtraData`. Constructed once from a single comparator/merger/intersector/deduplicator
 * pipeline so both consumers share the same configuration without duplicating setup code.
 *
 * The merge knows only the draft-07 tuple, so where an entry declares `prefixItems` and none a draft-07 tuple, the
 * entries are merged as the draft-07 tuples they equal and the result turned back. A single `items` beside no
 * `prefixItems` describes every item in both drafts, so it meets each position as it meets a draft-07 tuple's.
 *
 * Usage: pass a schema that contains an `allOf` keyword and receive the merged result.
 *
 * @example
 * const merged = shallowAllOfMerge(schema); // schema.allOf is merged into the parent schema
 */
export default function shallowAllOfMerge(schema: JSONSchema7Definition): JSONSchema7Definition {
  const schemas = allOfSchemas(schema);
  const objects = schemas.filter((entry) => typeof entry !== 'boolean');
  const isPrefixTuple =
    objects.some((entry) => Array.isArray(entry.prefixItems)) &&
    !objects.some(
      (entry) =>
        Array.isArray(entry.items) || (Array.isArray(entry.prefixItems) && entry.additionalItems !== undefined),
    );
  return isPrefixTuple
    ? swapTupleKeys(mergeArrayOfSchemaDefinitions(schemas.map((entry) => swapTupleKeys(entry))), true)
    : mergeArrayOfSchemaDefinitions(schemas);
}
