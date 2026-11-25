import {
  assignSchemaDefinitionOrRecord,
  createComparator,
  createMerger,
  isAllowAnySchema,
} from '@x0k/json-schema-merge';
import { createDeduplicator, createIntersector } from '@x0k/json-schema-merge/lib/array';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

const { compareSchemaDefinitions, compareSchemaValues } = createComparator();
const { mergeArrayOfSchemaDefinitions } = createMerger({
  intersectJson: createIntersector(compareSchemaValues),
  deduplicateJsonSchemaDef: createDeduplicator(compareSchemaDefinitions),
  // JSON Schema reads an absent `additionalProperties` as `true`, which the library drops, but the form reads an absent
  // one as `additionalPropertiesWhenAbsent` says, so an explicit `true` or `{}` is kept
  assignSchemaDefinitionOrRecord: (target, key, value) => {
    if (key === 'additionalProperties' && value !== undefined) {
      // oxlint-disable-next-line no-param-reassign -- the library's assigner sets the keyword on the schema it builds
      target[key] = value;
    } else {
      assignSchemaDefinitionOrRecord(target, key, value);
    }
  },
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

/** Whether an `unevaluatedProperties` of `entry` closes the object to keys an `additionalProperties` of another schema
 * merged with it takes: one other than `true` or `{}`, beside no `additionalProperties` of the entry's own, since an
 * entry's `unevaluatedProperties` sees only the annotations of the entry itself
 */
function closesSiblingKeys(entry: JSONSchema7): boolean {
  const unevaluated: unknown = Reflect.get(entry, 'unevaluatedProperties');
  return (
    entry.additionalProperties === undefined &&
    unevaluated !== undefined &&
    unevaluated !== true &&
    !(typeof unevaluated === 'object' && unevaluated !== null && Object.keys(unevaluated).length === 0)
  );
}

/** Returns `merged`, the merge of `objects`, without an `additionalProperties` of `true` or `{}` that one of `siblings`
 * closes the keys of (see `closesSiblingKeys()`), since the merge keeps it beside the sibling's
 * `unevaluatedProperties`, which then no longer sees only its own entry's annotations. Each property is read the same
 * way against the declarations of it that `objects` hold, every one of which is a sibling of the others.
 * shortcut: only `properties` are followed, not `patternProperties`, `items`, `dependencies` or the options of a list
 * merged below, upgrade if a schema closes the keys of a subschema merged there
 */
function withoutClosedAdditionalProperties(
  merged: JSONSchema7Definition,
  objects: readonly JSONSchema7[],
  siblings: readonly JSONSchema7[],
): JSONSchema7Definition {
  if (typeof merged === 'boolean') {
    return merged;
  }
  let result = merged;
  if (
    merged.additionalProperties !== undefined &&
    isAllowAnySchema(merged.additionalProperties) &&
    siblings.some(closesSiblingKeys)
  ) {
    const { additionalProperties: _open, ...rest } = merged;
    result = rest;
  }
  const { properties } = result;
  if (properties === undefined) {
    return result;
  }
  let kept: Record<string, JSONSchema7Definition> | undefined;
  for (const [key, property] of Object.entries(properties)) {
    const declared = objects.flatMap((entry) => {
      const declaration = entry.properties?.[key];
      return typeof declaration === 'object' ? [declaration] : [];
    });
    // A property only one of them declares is that declaration, which the merge left as it stands
    const closed = declared.length > 1 ? withoutClosedAdditionalProperties(property, declared, declared) : property;
    if (closed !== property) {
      kept ??= { ...properties };
      kept[key] = closed;
    }
  }
  return kept === undefined ? result : { ...result, properties: kept };
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
  // The object's own `unevaluatedProperties` sees the annotations of its entries
  return withoutClosedAdditionalProperties(merged, objects, objects.slice(1));
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
export function mergedPair(
  left: JSONSchema7Definition,
  right: JSONSchema7Definition,
): JSONSchema7Definition | undefined {
  try {
    const objects = [left, right].filter((entry) => typeof entry !== 'boolean');
    const merged = withoutClosedAdditionalProperties(mergeArrayOfSchemaDefinitions([left, right]), objects, objects);
    return typeof merged === 'boolean' ? merged : { ...merged };
  } catch {
    return undefined;
  }
}

/** Returns the options the shallow merge offers for `first` and `rest`, the `anyOf` or `oneOf` lists its schemas hold
 * under one keyword: each option of the first merged with each of the next's, a list at a time and in their order, a
 * pair that can't merge left out and one equal to an option already kept dropped, as the merge combines them. Merged
 * here, each keeps the options it was built from, and each pair keeps an `additionalProperties: true`, as the shallow
 * merge keeps one.
 *
 * @param first - The first list, in the order their schemas are merged
 * @param rest - The lists after it
 * @param [pair] - Merges an option built so far with one of the next list, or rejects the pair; the shallow merge's
 *        by default
 * @param [dropEqual=true] - Whether a pair equal to an option already kept is dropped, as the shallow merge drops it
 * @returns - The options, or undefined where no pair merges, which the merge rejects
 */
export function mergeOptionLists(
  first: readonly JSONSchema7Definition[],
  rest: readonly (readonly JSONSchema7Definition[])[],
  pair: (left: JSONSchema7Definition, right: JSONSchema7Definition) => JSONSchema7Definition | undefined = mergedPair,
  dropEqual = true,
): MergedOption[] | undefined {
  let merged: MergedOption[] = first.map((option) => ({ option, sources: [option] }));
  for (const list of rest) {
    const next: MergedOption[] = [];
    for (const left of merged) {
      for (const right of list) {
        const option = pair(left.option, right);
        if (
          option !== undefined &&
          !(dropEqual && next.some((kept) => compareSchemaDefinitions(kept.option, option) === 0))
        ) {
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
