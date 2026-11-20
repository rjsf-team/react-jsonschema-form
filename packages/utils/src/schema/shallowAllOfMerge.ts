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

/** Returns `merged` holding the `additionalProperties` of `true` or `{}` the merge dropped. JSON Schema reads an absent
 * keyword as `true`, so the merge drops one saying only that, where the form reads an absent one as
 * `additionalPropertiesWhenAbsent` says. The merge keeps a `false` or a schema in any entry, so a dropped keyword was
 * `true` or `{}` in every entry naming it
 */
function withOpenAdditionalProperties(
  merged: JSONSchema7Definition,
  objects: readonly JSONSchema7[],
): JSONSchema7Definition {
  if (typeof merged === 'boolean' || merged.additionalProperties !== undefined) {
    return merged;
  }
  const open = objects.find((entry) => entry.additionalProperties !== undefined)?.additionalProperties;
  return open === undefined ? merged : { ...merged, additionalProperties: open };
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
  const merged = isPrefixTuple
    ? swapTupleKeys(mergeArrayOfSchemaDefinitions(schemas.map((entry) => swapTupleKeys(entry))), true)
    : mergeArrayOfSchemaDefinitions(schemas);
  return withOpenAdditionalProperties(merged, objects);
}

/** An option the merge of option lists builds, with the options of the lists it was built from, in their order */
export interface MergedOption {
  readonly option: JSONSchema7Definition;
  readonly sources: readonly JSONSchema7Definition[];
}

/** Returns `left` and `right` merged as the merge of option lists merges a pair, their own `allOf` entries kept rather
 * than flattened, which would keep only the first `$ref` among them, or undefined for a pair the merge rejects. The
 * result is a new object, since a pair holding an empty option merges to the other, whose recorded sources it would
 * otherwise overwrite
 */
function mergedPair(left: JSONSchema7Definition, right: JSONSchema7Definition): JSONSchema7Definition | undefined {
  try {
    const merged = withOpenAdditionalProperties(
      mergeArrayOfSchemaDefinitions([left, right]),
      [left, right].filter((entry) => typeof entry !== 'boolean'),
    );
    return typeof merged === 'boolean' ? merged : { ...merged };
  } catch {
    return undefined;
  }
}

/** Returns the options the shallow merge offers for `first` and `rest`, the `anyOf` or `oneOf` lists its schemas hold
 * under one keyword: each option of the first merged with each of the next's, a list at a time and in their order, a
 * pair that can't merge left out and one equal to an option already kept dropped, as the merge combines them. Merged
 * here, each keeps the options it was built from, and each pair keeps an `additionalProperties: true` the merge would
 * drop.
 *
 * @param first - The first list, in the order their schemas are merged
 * @param rest - The lists after it
 * @returns - The options, or undefined where no pair merges, which the merge rejects
 */
export function mergeOptionLists(
  first: readonly JSONSchema7Definition[],
  rest: readonly (readonly JSONSchema7Definition[])[],
): MergedOption[] | undefined {
  let merged: MergedOption[] = first.map((option) => ({ option, sources: [option] }));
  for (const list of rest) {
    const next: MergedOption[] = [];
    for (const left of merged) {
      for (const right of list) {
        const option = mergedPair(left.option, right);
        if (option !== undefined && !next.some((kept) => compareSchemaDefinitions(kept.option, option) === 0)) {
          next.push({ option, sources: [...left.sources, right] });
        }
      }
    }
    if (next.length === 0) {
      return undefined;
    }
    merged = next;
  }
  return merged;
}
