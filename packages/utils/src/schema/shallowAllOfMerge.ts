import { createComparator, createMerger, isAllowAnySchema } from '@x0k/json-schema-merge';
import { createDeduplicator, createIntersector } from '@x0k/json-schema-merge/lib/array';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

import { patternRegExp } from '../additionalPropertiesUtils.ts';

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

/** Returns the object subschemas of `objects` that describe the value of `key`: an entry's declaration of it and the
 * `patternProperties` subschemas matching it, or, in an entry with neither, its `additionalProperties`
 */
function subschemasOf(key: string, objects: readonly JSONSchema7[]): JSONSchema7[] {
  return objects.flatMap((entry) => {
    const reaching: (JSONSchema7Definition | undefined)[] = Object.entries(entry.patternProperties ?? {})
      .filter(([pattern]) => patternRegExp(pattern).test(key))
      .map(([, subschema]) => subschema);
    if (entry.properties !== undefined && Object.hasOwn(entry.properties, key)) {
      reaching.push(entry.properties[key]);
    }
    if (reaching.length === 0) {
      reaching.push(entry.additionalProperties);
    }
    return reaching.filter((subschema) => typeof subschema === 'object');
  });
}

/** Returns `entry` and the subschemas it applies to its own value, its `allOf`, `anyOf`, `oneOf`, `then`, `else`,
 * `dependencies` and `dependentSchemas` ones, theirs included
 */
function withInPlaceSubschemas(entry: JSONSchema7): JSONSchema7[] {
  const dependentSchemas: unknown = Reflect.get(entry, 'dependentSchemas');
  const inPlace = [
    ...(entry.allOf ?? []),
    ...(entry.anyOf ?? []),
    ...(entry.oneOf ?? []),
    entry.then,
    entry.else,
    ...Object.values(entry.dependencies ?? {}),
    ...(typeof dependentSchemas === 'object' && dependentSchemas !== null ? Object.values(dependentSchemas) : []),
  ].filter((subschema): subschema is JSONSchema7 => typeof subschema === 'object' && !Array.isArray(subschema));
  return [entry, ...inPlace.flatMap(withInPlaceSubschemas)];
}

/** Returns `merged`, the merge of `objects`, holding the `additionalProperties` of `true` or `{}` the merge dropped,
 * unless one of `siblings` closes the keys it takes (see `closesSiblingKeys()`), where one the merge kept is left out.
 * JSON Schema reads an absent keyword as `true`, so the merge drops one saying only that, where the form reads an
 * absent one as `additionalPropertiesWhenAbsent` says. The merge keeps a `false` or a schema in any entry, so a dropped
 * keyword was `true` or `{}` in every entry naming it. Each property is read the same way against the subschemas of
 * `scope` that describe it (see `subschemasOf()`), every one of which is a sibling of the others; a subschema anywhere
 * else keeps what the merge made of it.
 */
function withOpenAdditionalProperties(
  merged: JSONSchema7Definition,
  objects: readonly JSONSchema7[],
  siblings: readonly JSONSchema7[],
  scope: readonly JSONSchema7[] = objects.flatMap(withInPlaceSubschemas),
): JSONSchema7Definition {
  if (typeof merged === 'boolean') {
    return merged;
  }
  let result = merged;
  if (siblings.some(closesSiblingKeys)) {
    if (merged.additionalProperties !== undefined && isAllowAnySchema(merged.additionalProperties)) {
      const { additionalProperties: _open, ...rest } = merged;
      result = rest;
    }
  } else if (merged.additionalProperties === undefined) {
    const open = objects.find((entry) => entry.additionalProperties !== undefined)?.additionalProperties;
    result = open === undefined ? merged : { ...merged, additionalProperties: open };
  }
  const { properties } = result;
  if (properties === undefined) {
    return result;
  }
  let kept: Record<string, JSONSchema7Definition> | undefined;
  for (const [key, property] of Object.entries(properties)) {
    const declared = subschemasOf(key, objects);
    // A property only one subschema describes is that declaration, which the merge left as it stands
    if (declared.length > 1) {
      // An option, or a `then`, `else`, `dependencies` or `dependentSchemas` subschema, describes the property only under
      // a choice or condition the form resolves after reading this merge, so one that closes it is read as closing it
      const describing = subschemasOf(key, scope).flatMap(withInPlaceSubschemas);
      const open = withOpenAdditionalProperties(property, declared, describing, describing);
      if (open !== property) {
        kept ??= { ...properties };
        kept[key] = open;
      }
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
  return withOpenAdditionalProperties(merged, objects, objects.slice(1));
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
    const merged = withOpenAdditionalProperties(mergeArrayOfSchemaDefinitions([left, right]), objects, objects);
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
