import {
  assignSchemaDefinitionOrRecord,
  createComparator,
  createMerger,
  isAllowAnySchema,
  ITEMS_ASSIGNER_KEYS,
  PROPERTIES_ASSIGNER_KEYS,
} from '@x0k/json-schema-merge';
import type { Assigner } from '@x0k/json-schema-merge';
import { createDeduplicator, createIntersector } from '@x0k/json-schema-merge/lib/array';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

import { patternRegExp } from '../additionalPropertiesUtils.ts';
import { getByPath } from '../pathUtils.ts';

const { compareSchemaDefinitions, compareSchemaValues } = createComparator();

/** Keywords whose subschemas an `unevaluatedProperties` beside them also sees the annotations of */
const IN_PLACE_KEYS = [
  'allOf',
  'anyOf',
  'oneOf',
  'if',
  'then',
  'else',
  'dependentSchemas',
  '$ref',
  '$dynamicRef',
  '$recursiveRef',
];

/** The schemas handed to the merge without a keyword of `IN_PLACE_KEYS` they hold, see `withoutInPlaceKeys()` */
const partial = new WeakMap<object, JSONSchema7 | undefined>();

/** The schemas of the `unevaluatedProperties` the merge has read as an `additionalProperties`, and what they merge to */
const rewritten = new WeakSet<object>();

/** Whether a `dependencies` of `schema` holds a schema, which it applies in place, rather than only lists of keys */
function hasSchemaDependency(schema: object): boolean {
  const dependencies: unknown = Reflect.get(schema, 'dependencies');
  return isObjectSchema(dependencies) && Object.values(dependencies).some((dependency) => !Array.isArray(dependency));
}

/** Copies `schema` without `keys`, keywords whose subschemas its `unevaluatedProperties` sees. A copy that loses one,
 * or is made of such a copy, is marked for the merge to keep that `unevaluatedProperties` a keyword rather than read it
 * as closing every key the copy leaves undeclared, and to read what the schema declares from the schema as written
 */
export function withoutInPlaceKeys<S extends object>(schema: S, ...keys: string[]): S {
  const copy = { ...schema };
  for (const key of keys) {
    Reflect.deleteProperty(copy, key);
  }
  if (
    partial.has(schema) ||
    keys.some((key) => (key === 'dependencies' ? hasSchemaDependency(schema) : Object.hasOwn(schema, key)))
  ) {
    partial.set(copy, partial.get(schema) ?? schema);
  }
  return copy;
}

/** Returns `schema`, what a branch, a dependency or `members` merged into `part` made of it, marked as `part` is (see
 * `withoutInPlaceKeys()`). `members`, which a `$ref` beside the keywords of `part` can bring, are read as entries of the
 * `allOf` of the schema as written
 */
export function markedAs<S extends object>(schema: S, part: object, members: readonly object[] = []): S {
  if (partial.has(part)) {
    const source = partial.get(part);
    partial.set(schema, source && { ...source, allOf: [...(source.allOf ?? []), ...(members as JSONSchema7[])] });
  }
  return schema;
}

/** Returns `schema` with its `unevaluatedProperties` as the `additionalProperties` it equals where nothing applies a
 * subschema in place beside it, or dropped beside an `additionalProperties` of its own, which leaves it no key to see
 */
function rewriteUnevaluated(schema: JSONSchema7): JSONSchema7 {
  if (Reflect.get(schema, 'unevaluatedProperties') === undefined || partial.has(schema)) {
    return schema;
  }
  const { unevaluatedProperties, ...rest } = schema as JSONSchema7 & { unevaluatedProperties: JSONSchema7Definition };
  // A `null` one reads as absent, as `additionalPropertiesKeywordName()` reads it
  if (rest.additionalProperties != null) {
    return rest;
  }
  if (IN_PLACE_KEYS.some((key) => Reflect.get(schema, key) !== undefined) || hasSchemaDependency(schema)) {
    return schema;
  }
  // A copy, so that the schema as written, which may be shared, is never one of `rewritten`
  if (typeof unevaluatedProperties === 'boolean') {
    return { ...rest, additionalProperties: unevaluatedProperties };
  }
  const additionalProperties = { ...unevaluatedProperties };
  rewritten.add(additionalProperties);
  return { ...rest, additionalProperties };
}

/** The depth of the pair being merged, the entries of an `allOf` being at 1, and the deepest depth below the pair whose
 * `additionalProperties` the post-step checks, see `withoutClosedAdditionalProperties()`
 */
let depth = 0;
let checked = 1;
/** How many of the pairs being merged hold one of `rewritten` */
let within = 0;

/** Returns `assign` reading the subschemas it merges as ones the post-step checks, unless `skips` the pair */
function checkedBelow(assign: Assigner<JSONSchema7>, skips?: (schema: JSONSchema7) => boolean): Assigner<JSONSchema7> {
  return (target, left, right) => {
    const outer = checked;
    if (depth <= checked && !skips?.(left) && !skips?.(right)) {
      checked = depth + 1;
    }
    try {
      const merged = assign(target, left, right);
      // What one of `rewritten` merges to with the other schema's `additionalProperties` still rejects the keys that
      // can't meet it, where a property merged with one is a property like any other
      const { additionalProperties } = merged;
      if (
        isObjectSchema(additionalProperties) &&
        additionalProperties !== left.additionalProperties &&
        additionalProperties !== right.additionalProperties &&
        [left, right].some((side) => rewritten.has(side.additionalProperties as object))
      ) {
        rewritten.add(additionalProperties);
      }
      return merged;
    } finally {
      checked = outer;
    }
  };
}

const merger = createMerger({
  intersectJson: createIntersector(compareSchemaValues),
  deduplicateJsonSchemaDef: createDeduplicator(compareSchemaDefinitions),
  // JSON Schema reads an absent `additionalProperties` as `true`, which the library drops, but the form reads an absent
  // one as `additionalPropertiesWhenAbsent` says, so an explicit `true` or `{}` is kept where the post-step checks it
  assignSchemaDefinitionOrRecord: (target, key, value) => {
    if (key === 'additionalProperties' && value !== undefined && depth <= checked) {
      // oxlint-disable-next-line no-param-reassign -- the library's assigner sets the keyword on the schema it builds
      target[key] = value;
    } else {
      assignSchemaDefinitionOrRecord(target, key, value);
    }
  },
  assigners: [
    [PROPERTIES_ASSIGNER_KEYS, checkedBelow((target, left, right) => merger.propertiesAssigner(target, left, right))],
    [
      ITEMS_ASSIGNER_KEYS,
      checkedBelow(
        (target, left, right) => merger.itemsAssigner(target, left, right),
        (schema) => Array.isArray(schema.items),
      ),
    ],
  ],
  // Two `unevaluatedProperties` kept as keywords each reject what theirs does, so both hold
  unknownMerger: (left: unknown, right: unknown, key) =>
    key === 'unevaluatedProperties' ? mergePair(left as JSONSchema7Definition, right as JSONSchema7Definition) : left,
  schemaDefinitionMerger: mergePair,
});

/** Merges a pair of schemas. An `unevaluatedProperties` sees only the annotations of its own schema, so it is merged as
 * the `additionalProperties` it equals rather than as a keyword of the pair
 */
function mergePair(left: JSONSchema7Definition, right: JSONSchema7Definition): JSONSchema7Definition {
  // A subschema spelled `null` reads as an absent one, as the library's merge reads it
  if (!isObjectSchema(left) || !isObjectSchema(right)) {
    return merger.mergeSchemaDefinitions(left, right);
  }
  const [l, r] = [rewriteUnevaluated(left), rewriteUnevaluated(right)];
  const closing = rewritten.has(left) || rewritten.has(right) ? 1 : 0;
  depth += 1;
  within += closing;
  try {
    const merged = merger.mergeSchemaDefinitions(l, r);
    if (typeof merged === 'object') {
      // An entry merged with a schema allowing anything is returned as it stands, and keeps the source it names
      if (!partial.has(merged) && (partial.has(left) || partial.has(right))) {
        partial.set(merged, undefined);
      }
    }
    return merged;
  } catch (error) {
    // An `unevaluatedProperties` holding a schema that a sibling's property can't meet rejects that key alone, which
    // is the schema `false`. Any other conflict rejects the merge, which is how a merge of option lists drops a pair
    if (within > 0 && depth > 1 && depth <= checked) {
      return false;
    }
    throw error;
  } finally {
    depth -= 1;
    within -= closing;
  }
}

const { mergeArrayOfSchemaDefinitions } = merger;

/** Returns `schema` and the entries of its `allOf`, those of theirs included, in the order the merge takes them. An
 * entry's `unevaluatedProperties` sees the entries of its own `allOf`, so such an entry comes merged with them
 */
function allOfSchemas(schema: JSONSchema7Definition): JSONSchema7Definition[] {
  if (typeof schema === 'boolean' || schema.allOf === undefined) {
    return [schema];
  }
  if (Reflect.get(schema, 'unevaluatedProperties') !== undefined) {
    return [shallowAllOfMerge(schema)];
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

/** Returns the subschemas of a schema that describe one value it holds */
type Slot = (entry: JSONSchema7) => (JSONSchema7Definition | JSONSchema7Definition[] | undefined)[];

/** Returns the slot of the value of `key`: a schema's declaration of it and the `patternProperties` subschemas matching
 * it, or, in a schema with neither, its `additionalProperties`
 */
function propertySlot(key: string): Slot {
  return (entry) => {
    const reaching: (JSONSchema7Definition | undefined)[] = Object.entries(entry.patternProperties ?? {})
      .filter(([pattern]) => patternRegExp(pattern).test(key))
      .map(([, subschema]) => subschema);
    if (entry.properties !== undefined && Object.hasOwn(entry.properties, key)) {
      reaching.push(entry.properties[key]);
    }
    return reaching.length === 0 ? [entry.additionalProperties] : reaching;
  };
}

/** Returns the slots of the values `schema` describes whose merge keeps an `additionalProperties` of `true` or `{}`,
 * each with the keyword holding its subschema and the key under that keyword, if it has one: every property and
 * pattern, the `additionalProperties` and an `items` describing every item. A pattern is read against the
 * same pattern or else the `additionalProperties` of each schema; one the merge built from two patterns is read as
 * closed, see `withoutClosedAdditionalProperties()`
 */
function slotsOf(schema: JSONSchema7): [keyof JSONSchema7, string | undefined, Slot][] {
  return [
    ...Object.keys(schema.properties ?? {}).map((key): [keyof JSONSchema7, string, Slot] => [
      'properties',
      key,
      propertySlot(key),
    ]),
    ...Object.keys(schema.patternProperties ?? {}).map((pattern): [keyof JSONSchema7, string, Slot] => [
      'patternProperties',
      pattern,
      (entry) => [
        entry.patternProperties !== undefined && Object.hasOwn(entry.patternProperties, pattern)
          ? entry.patternProperties[pattern]
          : entry.additionalProperties,
      ],
    ]),
    ['additionalProperties', undefined, (entry) => [entry.additionalProperties]],
    ['items', undefined, (entry) => [entry.items]],
  ];
}

/** Whether `value` is a schema object, rather than a boolean schema, a tuple or an absent keyword */
function isObjectSchema(value: unknown): value is JSONSchema7 {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Returns the object subschemas of `objects` in `slot` */
function subschemasOf(slot: Slot, objects: readonly JSONSchema7[]): JSONSchema7[] {
  return objects.flatMap(slot).filter(isObjectSchema);
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

/** Returns the subschemas `entries` apply to their own value (see `withInPlaceSubschemas()`), each `$ref` among them
 * followed to the definition `resolve` finds for it, once each, so a definition describing the object is read as one
 *
 * @param entries - The schemas
 * @param [resolve] - Returns the definition a schema's `$ref` names, if it is known
 * @returns - The subschemas, the definitions followed included
 */
function inPlaceResolved(
  entries: readonly JSONSchema7[],
  resolve?: (schema: JSONSchema7) => JSONSchema7 | undefined,
): JSONSchema7[] {
  const seen = new Set<JSONSchema7>();
  const visit = (entry: JSONSchema7): JSONSchema7[] =>
    withInPlaceSubschemas(entry).flatMap((subschema) => {
      const target = subschema.$ref === undefined ? undefined : resolve?.(subschema);
      if (target === undefined || seen.has(target)) {
        return [subschema];
      }
      seen.add(target);
      return [subschema, ...visit(target)];
    });
  return entries.flatMap(visit);
}

/** Returns `merged`, the merge of `objects`, without an `additionalProperties` of `true` or `{}` where `closed` or one
 * of `siblings` closes the keys it takes (see `closesSiblingKeys()`). The merge reads an `unevaluatedProperties` that
 * stands alone in a schema as the `additionalProperties` it equals, so what is left to find here is one beside
 * subschemas applied in place, and one the merge never meets. Each value the merge keeps the keyword for (see
 * `slotsOf()`) is read the same way against the subschemas of `objects` and `outside`, and those they apply in place
 * (see `withInPlaceSubschemas()`), that describe it, every one of which is a sibling of the others; a subschema
 * anywhere else keeps what the merge made of it. A value's subschema of `unchecked` holding a `$ref` is read as closing
 * it and every value below it, since the reference isn't resolved here and the form, which resolves it, never meets it
 * beside the merged value. Any other `$ref` describing a value is followed to the definition `resolve` finds for it.
 */
function withoutClosedAdditionalProperties(
  merged: JSONSchema7Definition,
  objects: readonly JSONSchema7[],
  siblings: readonly JSONSchema7[],
  outside: readonly JSONSchema7[] = [],
  unchecked: readonly JSONSchema7[] = [],
  resolve?: (schema: JSONSchema7) => JSONSchema7 | undefined,
  closed = false,
): JSONSchema7Definition {
  if (typeof merged === 'boolean') {
    return merged;
  }
  let result = merged;
  if (
    merged.additionalProperties !== undefined &&
    isAllowAnySchema(merged.additionalProperties) &&
    (closed || siblings.some(closesSiblingKeys))
  ) {
    const { additionalProperties: _open, ...rest } = merged;
    result = rest;
  }
  let scope: JSONSchema7[] | undefined;
  for (const [keyword, key, slot] of slotsOf(result)) {
    // A pattern none of `objects` declares is one the merge built from two of theirs, whose subschemas it merged
    const built =
      keyword === 'patternProperties' &&
      !objects.some((entry) => Object.hasOwn(entry.patternProperties ?? {}, key as string));
    const declared = subschemasOf(built ? (entry) => Object.values(entry.patternProperties ?? {}) : slot, objects);
    const held: unknown = result[keyword];
    const subschema: unknown = key === undefined ? held : Reflect.get(held as object, key);
    // A value only one subschema describes is that declaration, which the merge left as it stands, and an allow-any one
    // the merge or the strip above left out holds no keyword to strip. shortcut: a tuple of another entry that the
    // declarations merged into is skipped; upgrade if a closer under a condition has to reach its items
    if (declared.length > 1 && isObjectSchema(subschema)) {
      // An option, or a `then`, `else`, `dependencies` or `dependentSchemas` subschema, describes the value only under a
      // choice or condition the form resolves after reading this merge, so one that closes it is read as closing it
      scope ??= [...objects.flatMap(withInPlaceSubschemas), ...outside];
      const describing = inPlaceResolved(subschemasOf(slot, scope), resolve);
      const beyond = subschemasOf(slot, unchecked).flatMap(withInPlaceSubschemas);
      const stripped = withoutClosedAdditionalProperties(
        subschema,
        declared,
        describing,
        describing,
        beyond,
        resolve,
        closed || built || beyond.some((entry) => entry.$ref !== undefined),
      );
      if (stripped !== subschema) {
        result = { ...result, [keyword]: key === undefined ? stripped : { ...(held as object), [key]: stripped } };
      }
    }
  }
  return result;
}

/** Returns the subschemas `entry` applies to its own value, and those an `if` among them applies to its own, or
 * undefined where one of them sees every key: it holds an `additionalProperties` or, the entry aside, an
 * `unevaluatedProperties` that takes keys, so one other than `false`, or a `$ref`, which isn't resolved here and is read
 * as declaring every key
 */
function seenBy(entry: JSONSchema7): JSONSchema7[] | undefined {
  const subschemas = withInPlaceSubschemas(entry).flatMap((subschema) => [
    subschema,
    ...(isObjectSchema(subschema.if) ? withInPlaceSubschemas(subschema.if) : []),
  ]);
  const takesKeys = (value: unknown) => value != null && value !== false;
  return subschemas.some(
    (subschema) =>
      takesKeys(subschema.additionalProperties) ||
      (subschema !== entry && takesKeys(Reflect.get(subschema, 'unevaluatedProperties'))) ||
      IN_PLACE_KEYS.slice(-3).some((ref) => Reflect.get(subschema, ref) !== undefined),
  )
    ? undefined
    : subschemas;
}

/** Whether an `unevaluatedProperties` of `entry` reaches the keys none of the subschemas the entry sees (see
 * `seenBy()`) `declares`
 */
function rejects(entry: JSONSchema7, declares: (subschema: JSONSchema7) => boolean): boolean {
  return seenBy(entry)?.some(declares) === false;
}

/** Returns `record` without the keys one of `closers` rejects (see `rejects()`), or undefined where none is left */
function unrejected<V>(
  record: Record<string, V> | undefined,
  closers: readonly JSONSchema7[],
  declares: (subschema: JSONSchema7, key: string) => boolean,
): Record<string, V> | undefined {
  const kept = Object.entries(record ?? {}).filter(
    ([key]) => !closers.some((entry) => rejects(entry, (subschema) => declares(subschema, key))),
  );
  return kept.length > 0 ? Object.fromEntries(kept) : undefined;
}

/** Returns `open` without the `properties`, `patternProperties` and `additionalProperties` one of `closers`, each an
 * `unevaluatedProperties: false` that sees only its own subschemas, rejects (see `rejects()`)
 */
function withoutRejected(open: JSONSchema7Definition, closers: readonly JSONSchema7[]): JSONSchema7Definition {
  if (typeof open !== 'object' || closers.length === 0) {
    return open;
  }
  const { properties, patternProperties, additionalProperties, ...rest } = open;
  const seen = {
    properties: unrejected(
      properties,
      closers,
      (subschema, key) =>
        Object.hasOwn(subschema.properties ?? {}, key) ||
        Object.keys(subschema.patternProperties ?? {}).some((pattern) => patternRegExp(pattern).test(key)),
    ),
    patternProperties: unrejected(patternProperties, closers, (subschema, pattern) =>
      Object.hasOwn(subschema.patternProperties ?? {}, pattern),
    ),
    // A `false` closes what the entry does, and says so to a reader that knows no `unevaluatedProperties`
    additionalProperties:
      additionalProperties !== false && closers.some((entry) => rejects(entry, () => false))
        ? undefined
        : additionalProperties,
  };
  return { ...rest, ...Object.fromEntries(Object.entries(seen).filter(([, value]) => value !== undefined)) };
}

/** Returns `open` with the keys `closer` doesn't declare meeting the schema its `unevaluatedProperties` holds, which
 * sees only the closer's own subschemas: a property or pattern of `open` that none of them declares is merged with that
 * schema, to `false` where it can't meet it, and so is an `additionalProperties` of `open`
 */
function meeting(open: JSONSchema7, closer: JSONSchema7): JSONSchema7 {
  const seen = seenBy(closer);
  if (seen === undefined) {
    return open;
  }
  const declared = (keyword: 'properties' | 'patternProperties') =>
    Object.fromEntries(seen.flatMap((subschema) => Object.keys(subschema[keyword] ?? {})).map((key) => [key, {}]));
  const closing: JSONSchema7 = { properties: declared('properties'), patternProperties: declared('patternProperties') };
  Reflect.set(closing, 'unevaluatedProperties', Reflect.get(closer, 'unevaluatedProperties'));
  // An `unevaluatedProperties` the schema keeps as a keyword stays one, rather than being read as closing its keys
  const { unevaluatedProperties, ...bare } = open as JSONSchema7 & { unevaluatedProperties?: JSONSchema7Definition };
  const merged = mergeArrayOfSchemaDefinitions([bare, closing]) as JSONSchema7;
  // The merge adds the keys the closer declares and the schema it holds, which stay the closer's
  const own = (keyword: 'properties' | 'patternProperties') =>
    open[keyword] && {
      [keyword]: Object.fromEntries(Object.keys(open[keyword]).map((key) => [key, getByPath(merged, [keyword, key])])),
    };
  const { properties: _properties, patternProperties: _patterns, additionalProperties, ...rest } = merged;
  return {
    ...rest,
    ...own('properties'),
    ...own('patternProperties'),
    ...(open.additionalProperties !== undefined && { additionalProperties }),
    ...(unevaluatedProperties !== undefined && { unevaluatedProperties }),
  };
}

/** Returns the schemas of `entries` as written whose `unevaluatedProperties` closes keys beside no
 * `additionalProperties` of their own
 */
function closersOf(entries: readonly JSONSchema7[]): JSONSchema7[] {
  return entries
    .map((entry) => partial.get(entry) ?? entry)
    .filter((entry) => {
      const unevaluated: unknown = Reflect.get(entry, 'unevaluatedProperties');
      return (
        (typeof unevaluated === 'boolean' || isObjectSchema(unevaluated)) &&
        !isAllowAnySchema(unevaluated) &&
        entry.additionalProperties == null
      );
    });
}

/** Returns `open` as `closers` leave it (see `closersOf()`): without the keys an `unevaluatedProperties: false` rejects
 * (see `withoutRejected()`), and with those one holding a schema reaches meeting it (see `meeting()`)
 */
function closedBy(open: JSONSchema7Definition, closers: readonly JSONSchema7[]): JSONSchema7Definition {
  const isFalse = (closer: JSONSchema7) => Reflect.get(closer, 'unevaluatedProperties') === false;
  return closers
    .filter((closer) => !isFalse(closer))
    .reduce(
      (result, closer) => (typeof result === 'object' ? meeting(result, closer) : result),
      withoutRejected(open, closers.filter(isFalse)),
    );
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
  // The schema's own `unevaluatedProperties` sees the annotations of its entries, so it is set aside and put back,
  // unless an `additionalProperties` or `unevaluatedProperties` of one of them leaves it no key to see
  const { unevaluatedProperties, ...own } = schema as JSONSchema7 & { unevaluatedProperties?: JSONSchema7Definition };
  const schemas = allOfSchemas(typeof schema === 'boolean' || unevaluatedProperties === undefined ? schema : own);
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
  const seesNothing = objects.some(
    (entry) => entry.additionalProperties != null || Reflect.get(entry, 'unevaluatedProperties') !== undefined,
  );
  let open = withoutClosedAdditionalProperties(merged, objects, objects);
  // An entry's `unevaluatedProperties: false` the merge kept as a keyword lands on the merged schema, where it would
  // read as seeing the keys the other entries declare. An option a merge of lists builds is read the same way, see
  // `mergeOptionLists()`
  open = closedBy(open, closersOf(objects.filter((entry) => rewriteUnevaluated(entry) === entry)));
  return unevaluatedProperties === undefined || seesNothing || typeof open === 'boolean'
    ? open
    : { ...open, unevaluatedProperties };
}

/** An option the merge of option lists builds, with the options of the lists it was built from, in their order */
export interface MergedOption {
  readonly option: JSONSchema7Definition;
  readonly sources: readonly JSONSchema7Definition[];
}

/** Returns `left` and `right` merged as the merge of option lists merges a pair, their own `allOf` entries kept rather
 * than flattened, which would keep only the first `$ref` among them, or undefined for a pair the merge rejects. The
 * result is a new object, since a pair holding an empty option merges to the other, whose recorded sources it would
 * otherwise overwrite. `outside`, the subschemas of the schemas the lists sit in, can close a property of the pair but
 * never opens one; the merge that later meets one of `unchecked`, those of them not reached through a `$ref`, holding a
 * `$ref` sees the property as the pair left it
 */
export function mergedPair(
  left: JSONSchema7Definition,
  right: JSONSchema7Definition,
  outside: readonly JSONSchema7[] = [],
  unchecked: readonly JSONSchema7[] = outside,
  resolve?: (schema: JSONSchema7) => JSONSchema7 | undefined,
): JSONSchema7Definition | undefined {
  try {
    const objects = [left, right].filter((entry) => typeof entry !== 'boolean');
    const merged = withoutClosedAdditionalProperties(
      mergeArrayOfSchemaDefinitions([left, right]),
      objects,
      objects,
      outside,
      unchecked,
      resolve,
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
 * drop. A pair is left as the `unevaluatedProperties` of `closers` leave it (see `closedBy()`), since each sees only the
 * closer's own subschemas, the options of a list it holds included.
 *
 * @param first - The first list, in the order their schemas are merged
 * @param rest - The lists after it
 * @param beside - The schemas holding the lists, without the keyword holding them
 * @param [pair] - Merges an option built so far with one of the next list, given the subschemas of `beside`, or rejects
 *        the pair; the shallow merge's by default
 * @param [dropEqual=true] - Whether a pair equal to an option already kept is dropped, as the shallow merge drops it
 * @param [resolve] - Returns the definition a `$ref` among the subschemas of `beside` names, so one describing the
 *        object, or a property a followed definition declares, can close a property of a pair
 * @param [closers] - The schemas beside the lists whose `unevaluatedProperties` sees only their own subschemas: the
 *        `allOf` entries and branches beside the object's own keywords, whose own `unevaluatedProperties` sees every option
 * @returns - The options, or undefined where no pair merges, which the merge rejects
 */
export function mergeOptionLists(
  first: readonly JSONSchema7Definition[],
  rest: readonly (readonly JSONSchema7Definition[])[],
  beside: readonly JSONSchema7[],
  pair: (
    left: JSONSchema7Definition,
    right: JSONSchema7Definition,
    outside: readonly JSONSchema7[],
    unchecked: readonly JSONSchema7[],
    resolve?: (schema: JSONSchema7) => JSONSchema7 | undefined,
  ) => JSONSchema7Definition | undefined = mergedPair,
  dropEqual = true,
  resolve?: (schema: JSONSchema7) => JSONSchema7 | undefined,
  closers: readonly JSONSchema7[] = [],
): MergedOption[] | undefined {
  const outside = inPlaceResolved(beside, resolve);
  const closing = closersOf(closers);
  // A `$ref` the pair can't follow, one declaring a property outside any followed definition, is read as closing it
  const unchecked = beside.flatMap(withInPlaceSubschemas);
  let merged: MergedOption[] = first.map((option) => ({ option, sources: [option] }));
  for (const list of rest) {
    const next: MergedOption[] = [];
    for (const left of merged) {
      for (const right of list) {
        let option = pair(left.option, right, outside, unchecked, resolve);
        try {
          option = option === undefined ? undefined : closedBy(option, closing);
        } catch {
          // A closer the pair can't be read against, as one holding a pattern that is no regular expression, rejects it
          option = undefined;
        }
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
