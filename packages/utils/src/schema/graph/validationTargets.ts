import { allowsAdditionalProperties, patternRegExp, readsAbsentAsAllowed } from '../../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_ITEMS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  CONST_KEY,
  CONTAINS_KEY,
  DEFINITIONS_KEY,
  DEPENDENCIES_KEY,
  DEPENDENT_REQUIRED_KEY,
  DEPENDENT_SCHEMAS_KEY,
  DISCRIMINATOR_PATH,
  ELSE_KEY,
  ENUM_KEY,
  ID_KEY,
  IF_KEY,
  ITEMS_KEY,
  NOT_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  REQUIRED_KEY,
  THEN_KEY,
  UNEVALUATED_ITEMS_KEY,
  UNEVALUATED_PROPERTIES_KEY,
} from '../../constants.ts';
import guessType from '../../guessType.ts';
import hashForSchema, { hashString, sortedJSONStringify } from '../../hashForSchema.ts';
import isObject, { isSchemaObject } from '../../isObject.ts';
import { getByPath } from '../../pathUtils.ts';
import { keywordShape } from '../../schemaUri.ts';
import type { FormContextType, GenericObjectType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../../types.ts';
import { CONTAINER_KEYWORDS } from '../schemaKeywords.ts';
import KeyedMemo from './keyedMemo.ts';
import { childPointer, isRootPointer } from './parseSchemaGraph.ts';
import type { NodeId, ObjectNode, SchemaGraph } from './parseSchemaGraph.ts';
import { booleanSchema, schemaFrom, schemaOfBoolean } from './schemaFrom.ts';

/** The suffix `withVariantId()` adds to an `$id`, matched at the end so deriving a variant of a variant replaces it
 * rather than stacking another one on
 */
const VARIANT_ID_SUFFIX = /\?rjsf=[^?]*$/;

/** Returns the `$id` naming a schema of the given `content` derived from the schema `id` names. Relative resolution
 * replaces the last path segment and drops the query, so a `$ref` inside the schema resolves against the base the
 * original `$id` gave it. An empty trailing fragment goes with the suffix, which would otherwise end up inside the
 * fragment, where the 2019-09 and 2020-12 meta-schemas reject it.
 *
 * @param id - The `$id` of the schema the derived one came from
 * @param content - The content the derived `$id` names, which it is hashed from
 * @returns - The derived `$id`
 */
function variantId(id: unknown, content: object): string {
  const base = String(id).replace(VARIANT_ID_SUFFIX, '').replace(/#$/, '');
  return `${base}?rjsf=${hashForSchema(content)}`;
}

/** Returns the `schema` with any `$id` it carries replaced by one derived from it and from the schema's own content. A
 * schema derived from another is not the schema that the other's `$id` names, and a validator caches the function it
 * compiles for a schema under that `$id`.
 *
 * @param schema - The schema derived from one that may carry an `$id`
 * @returns - The schema, carrying an `$id` that names it rather than the one it was derived from
 */
export function withVariantId<S extends StrictRJSFSchema = RJSFSchema>(schema: S): S {
  const id = schema[ID_KEY];
  if (!id) {
    return schema;
  }
  const { [ID_KEY]: _id, ...withoutId } = schema;
  return { ...schema, [ID_KEY]: variantId(id, withoutId) };
}

/** Returns the `$ref` naming the subschema at the JSON `pointer` in the root, encoded as `encodeURI()` encodes it,
 * which leaves the characters a fragment may hold, such as the `$` of `$defs`, as they are. A `#` is escaped too:
 * `encodeURI()` keeps it, and Ajv drops one ending the `$ref` as an empty fragment. A lone surrogate, which a property
 * name may hold, has no UTF-8 encoding and is left as it is, which ata reads as written; Ajv and cfworker throw on
 * compiling a root that holds one, whatever the `$ref`.
 */
function refTo(pointer: string): string {
  return `#${pointer.replace(/[^\uD800-\uDFFF]+/gu, (wellFormed) => encodeURI(wellFormed)).replaceAll('#', '%23')}`;
}

/** Returns `{ $ref }` naming the subschema at the JSON `pointer` in the root */
function refAt(pointer: string): GenericObjectType {
  return { [REF_KEY]: refTo(pointer) };
}

/** Where the root holds a subschema: a JSON pointer into it, or undefined for a subschema it does not hold, such as one
 * parsed from outside it
 */
type Place = string | undefined;

/** Returns the place below `place` at the unescaped pointer `tokens` */
function placeBelow(place: Place, tokens: readonly string[]): Place {
  return place === undefined ? undefined : childPointer(place, tokens);
}

/** Returns what tells the subschema `id` reached at `place` apart from the others on a walk: the place, or, for one
 * with no place in the root, the node
 */
function placeKey(id: NodeId, place: Place): string {
  return place ?? `@${id}`;
}

/** Returns the place the `$ref` of `node` names in the root, see `ObjectNode.refPointer` */
function refPlace(node: ObjectNode): Place {
  return node.refPointer !== undefined && isRootPointer(node.refPointer) ? node.refPointer : undefined;
}

/** Returns the place the node `id` was first found at in the root, if it was */
function firstPlace<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): Place {
  const node = graph.node(id);
  return node.kind === 'schema' && isRootPointer(node.pointer) ? node.pointer : undefined;
}

/** Returns what a validator checks the subschema `id` reached at `place` with: `{ $ref }` naming the place, or, where
 * it has none or for a boolean, what `targetOf()` hands it
 */
function targetAt<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId, place: Place): S {
  return place !== undefined && graph.node(id).kind === 'schema'
    ? schemaFrom(graph.rawRoot, refAt(place))
    : targetOf(graph, id);
}

/** The role of an `anyOf`/`oneOf` option in `Reached` */
const OPTION_ROLE = 'option';

/** A subschema a form validates data against, reached from the subschema holding it as the `role` says: `if` for its
 * `if`, `option` for one of its `anyOf`/`oneOf` options, or `dependencies/<key>` for a `oneOf` option of its
 * `dependencies` entry `key`
 */
interface Reached {
  readonly role: string;
  readonly id: NodeId;
  readonly place: Place;
  readonly key?: string;
}

/** Returns the subschemas a form validates data against that the subschema `id` holds where the root holds it at
 * `place`, each at the place it is reached at below that one, see `Reached`
 */
function reachedFrom<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId, place: string): Reached[] {
  const reached: Reached[] = [];
  const condition = graph.child(id, IF_KEY);
  if (condition !== undefined) {
    reached.push({ role: IF_KEY, id: condition, place: childPointer(place, [IF_KEY]) });
  }
  for (const keyword of [ANY_OF_KEY, ONE_OF_KEY]) {
    for (const [index, option] of graph.subschemas(id, keyword)) {
      reached.push({ role: OPTION_ROLE, id: option, place: childPointer(place, [keyword, index]) });
    }
  }
  for (const [key, dependency] of graph.subschemas(id, DEPENDENCIES_KEY)) {
    for (const provider of scopeAt(graph, dependency, childPointer(place, [DEPENDENCIES_KEY, key]))) {
      for (const [index, option] of graph.subschemas(provider.node.id, ONE_OF_KEY)) {
        const role = `${DEPENDENCIES_KEY}/${key}`;
        reached.push({ role, id: option, place: placeBelow(provider.place, [ONE_OF_KEY, index]), key });
      }
    }
  }
  return reached;
}

/** The places `placesOf()` finds, per root graph */
const placesMemo = new KeyedMemo<ReadonlyMap<string, ReadonlyMap<NodeId, string>>>();

/** Returns the graph `graph` extends with schemas from outside the root, or the graph itself */
function rootGraphOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>): SchemaGraph<S> {
  return graph.base === undefined ? graph : rootGraphOf(graph.base);
}

/** Returns, per role `Reached` names, a place where the root of `graph` holds each node in that role: the place below
 * where the root first holds the subschema holding it. A precompiled validator lists every place a root holds a
 * subschema at in each role, see `validationTargets()`, so any of them is found in one compiled from any equal root,
 * whichever objects that root shares. The place a node was first found at is not enough: the root may hold one object
 * first as a property and only later as an option.
 */
function placesOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>): ReadonlyMap<string, ReadonlyMap<NodeId, string>> {
  const root = rootGraphOf(graph);
  return placesMemo.get([root], () => {
    const places = new Map<string, Map<NodeId, string>>();
    for (let id = 0; id < root.size; id += 1) {
      const place = firstPlace(root, id);
      for (const reached of place === undefined ? [] : reachedFrom(root, id, place)) {
        const byNode = places.get(reached.role) ?? new Map<NodeId, string>();
        places.set(reached.role, byNode);
        if (reached.place !== undefined && !byNode.has(reached.id)) {
          byNode.set(reached.id, reached.place);
        }
      }
    }
    return places;
  });
}

/** Returns the place where the root first holds the node `id` in the `role` `Reached` names */
function placeAs<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, role: string, id: NodeId): Place {
  return placesOf(graph).get(role)?.get(id);
}

/** Returns the place a form names the option `id` at: where the root holds it as an option, or else where it was
 * first found
 */
function optionPlace<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): Place {
  return placeAs(graph, OPTION_ROLE, id) ?? firstPlace(graph, id);
}

/** The `{ $ref }` `pointerTo()` names each node by, per graph and node, or `null` for a node it gives none, so a
 * validator caching what it compiles by schema is handed the same object for a node every time
 */
const pointers = new KeyedMemo<object | null>();

/** Returns `{ $ref }` naming the node `id` at a place the root holds it, which a validator resolves against the root it
 * is given: where it is an option, or else an `if`, which is where `validationTargets()` lists a pointer, or else where
 * it was first found. Undefined for a node with no place there or a boolean one, which holds no `$ref` for a pointer to
 * keep in reach and which ata reads as `true` behind a `$ref`.
 *
 * @param graph - The graph of the root
 * @param id - The node to name
 * @returns - The `$ref` wrapper
 */
export function pointerTo<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>, id: NodeId): S | undefined {
  const pointer = pointers.get([graph, id], () => {
    const place = placeAs(graph, OPTION_ROLE, id) ?? placeAs(graph, IF_KEY, id) ?? firstPlace(graph, id);
    return place === undefined || graph.node(id).kind !== 'schema' ? null : refAt(place);
  });
  return isSchemaObject<S>(pointer) ? pointer : undefined;
}

/** Returns what a validator checks the subschema `id` with: `{ $ref }` naming it in the root, or the subschema itself
 * when `pointerTo()` gives no pointer
 *
 * @param graph - The graph of the root
 * @param id - The node of the subschema
 * @returns - The schema to hand the validator
 */
export function targetOf<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>, id: NodeId): S {
  const pointer = pointerTo(graph, id);
  if (pointer !== undefined) {
    return pointer;
  }
  const node = graph.node(id);
  return node.kind === 'schema' ? node.raw : booleanSchema(node, graph.rawRoot);
}

/** A subschema in an option's scope, the place the walk of the scope reached it at, and whether it reached it through a
 * `dependentSchemas` entry
 */
interface Member<S extends StrictRJSFSchema> {
  readonly node: ObjectNode<S>;
  readonly place: Place;
  readonly dependent: boolean;
}

/** Which subschemas `scopeAt()` follows besides a `$ref` and the `allOf` entries: `unconditional` none, `conditional`
 * the `then`/`else` and the `dependencies` schemas, which apply only for some data, and `scored` the `dependentSchemas`
 * entries as well. Only scoring reads those, as it copies them, see `derive()`: what the form reads of a scope, such as
 * the declarations of a discriminator, is the `conditional` scope, which leaves the `dependentSchemas` entries out.
 */
type Follow = 'unconditional' | 'conditional' | 'scored';

/** Returns the nodes whose keywords apply wherever the node `id` applies: the node, what its `$ref` resolves to and its
 * `allOf` entries, and the conditional subschemas `follow` names. Each is followed the same way, at the place it is
 * reached at from `place`: below it, or where a `$ref` names. A place is listed once, so one object the root holds in
 * two places of the scope is listed at each, as two equal copies of it would be; a node with no place is listed once.
 * One reached both through a `dependentSchemas` entry and outside one is listed for each, so the members reached
 * outside one are the `conditional` scope. An object reached again below itself, which only a root holding itself
 * through its own objects does, is not followed.
 */
function scopeAt<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  place: Place,
  follow: Follow = 'conditional',
): Member<S>[] {
  const seen = new Set<string>();
  const members: Member<S>[] = [];
  const visit = (next: NodeId | undefined, at: Place, above: ReadonlySet<NodeId>, dependent: boolean) => {
    if (next === undefined || above.has(next)) {
      return;
    }
    const key = dependent ? `${placeKey(next, at)} dependent` : placeKey(next, at);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const node = graph.node(next);
    if (node.kind !== 'schema') {
      return;
    }
    members.push({ node, place: at, dependent });
    const inner = new Set(above).add(next);
    visit(node.ref, refPlace(node), new Set(), dependent);
    graph
      .subschemas(next, ALL_OF_KEY)
      .forEach(([index, member]) => visit(member, placeBelow(at, [ALL_OF_KEY, index]), inner, dependent));
    if (follow === 'unconditional') {
      return;
    }
    visit(graph.child(next, THEN_KEY), placeBelow(at, [THEN_KEY]), inner, dependent);
    visit(graph.child(next, ELSE_KEY), placeBelow(at, [ELSE_KEY]), inner, dependent);
    (follow === 'scored' ? [DEPENDENCIES_KEY, DEPENDENT_SCHEMAS_KEY] : [DEPENDENCIES_KEY]).forEach((keyword) =>
      graph
        .subschemas(next, keyword)
        .forEach(([entry, dependency]) =>
          visit(dependency, placeBelow(at, [keyword, entry]), inner, dependent || keyword === DEPENDENT_SCHEMAS_KEY),
        ),
    );
  };
  visit(id, place, new Set(), false);
  return members;
}

/** Returns the nodes `scopeAt()` lists for the node `id` reached at no place in particular */
function scopeOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): ObjectNode<S>[] {
  return scopeAt(graph, id, undefined).map(({ node }) => node);
}

/** Returns the declarations of the property `key` in the scope of the option `id` reached at `place`, each at the place
 * it is reached at: every one that applies whatever the data, as the OpenAPI spelling
 * `allOf: [{ $ref: Base }, { properties: { petType: { const: 'cat' } } }]` declares it twice, and the value has to fit
 * each of them. Where only a `then`, an `else` or a `dependencies` schema declares it, the first of those is read
 * alone: a `then` and its `else` apply to different data, and no value need fit both.
 */
function declarationsAt<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  place: Place,
  key: string,
): { readonly id: NodeId; readonly place: Place }[] {
  const declaredIn = (members: Member<S>[]) =>
    members.flatMap(({ node, place: at }) => {
      const property = graph.child(node.id, PROPERTIES_KEY, key);
      return property === undefined ? [] : [{ id: property, place: placeBelow(at, [PROPERTIES_KEY, key]) }];
    });
  const always = declaredIn(scopeAt(graph, id, place, 'unconditional'));
  return always.length > 0 ? always : declaredIn(scopeAt(graph, id, place)).slice(0, 1);
}

/** Returns the nodes of the property `key` the option `id` declares, see `declarationsAt()`
 *
 * @param graph - The graph of the root
 * @param id - The option, or any subschema declaring properties
 * @param key - The property name
 * @returns - The property's nodes, none when nothing in the scope declares it
 */
export function declaredProperties<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  key: string,
): readonly NodeId[] {
  return declarations.get([graph, id, key], () => declarationsAt(graph, id, undefined, key).map((found) => found.id));
}

/** The nodes `declaredProperties()` finds, per graph, option and key: an option is matched on its discriminator on
 * every edit, and walking its scope each time repeats the same answer
 */
const declarations = new KeyedMemo<readonly NodeId[]>();

/** Returns what a validator checks the value of the property `key` with that the option `id` reached at `place`
 * declares: `{ $ref }` naming the place of the one declaration `declarationsAt()` finds, or an `allOf` of them for
 * several, or undefined where the scope declares none
 */
function declaredPropertyTargetAt<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  place: Place,
  key: string,
): S | undefined {
  const targets = declarationsAt(graph, id, place, key).map((found) => targetAt(graph, found.id, found.place));
  return targets.length < 2 ? targets[0] : schemaFrom(graph.rawRoot, { [ALL_OF_KEY]: targets });
}

/** Returns what a validator checks the value of the property `key` the option `id` declares with, see
 * `declaredPropertyTargetAt()`, the option named where the root holds it as an option
 *
 * @param graph - The graph of the root
 * @param id - The option, or any subschema declaring properties
 * @param key - The property name
 * @returns - The schema to hand the validator, or undefined when nothing in the scope declares the property
 */
export function declaredPropertyTarget<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  key: string,
): S | undefined {
  const target = declaredPropertyTargets.get(
    [graph, id, key],
    () => declaredPropertyTargetAt(graph, id, optionPlace(graph, id), key) ?? null,
  );
  return isSchemaObject<S>(target) ? target : undefined;
}

/** The schemas `declaredPropertyTarget()` returns, per graph, option and key, or `null` where nothing declares the
 * property, so a validator caching what it compiles by schema is handed the same object every time
 */
const declaredPropertyTargets = new KeyedMemo<object | null>();

/** Returns the schema a dependency's `oneOf` option reached at `place` is matched on: an object whose `key` holds what
 * the option says the property holds, or undefined where the option declares no property `key`
 */
function dependencyConditionAt<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  option: NodeId,
  place: Place,
  key: string,
): S | undefined {
  const property = declaredPropertyTargetAt(graph, option, place, key);
  return property === undefined
    ? undefined
    : schemaFrom(graph.rawRoot, { type: 'object', properties: { [key]: property } });
}

/** Returns the schema a dependency's `oneOf` option is matched on, see `dependencyConditionAt()`, the option named
 * where the root holds it as an option of a dependency named `key`
 *
 * @param graph - The graph of the root
 * @param option - The node of the option
 * @param key - The name of the dependency
 * @returns - The condition to hand the validator, or undefined when the option declares no property `key`
 */
export function dependencyCondition<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  option: NodeId,
  key: string,
): S | undefined {
  const condition = dependencyConditions.get([graph, option, key], () => {
    const place = placeAs(graph, `${DEPENDENCIES_KEY}/${key}`, option) ?? optionPlace(graph, option);
    return dependencyConditionAt(graph, option, place, key) ?? null;
  });
  return isSchemaObject<S>(condition) ? condition : undefined;
}

/** The conditions `dependencyCondition()` builds, per graph, option and key, or `null` where the option declares no
 * such property, so a validator caching what it compiles by schema is handed the same object every time
 */
const dependencyConditions = new KeyedMemo<object | null>();

/** Which of the keywords in an option's scope scoring drops: the `required`s with the `dependencies` entries listing
 * names, and the `additionalProperties: false`s
 */
interface Loosening {
  required: boolean;
  additionalProperties: boolean;
}

/** The `Loosening` that drops nothing, for a subschema outside an option's scope */
const KEPT: Loosening = { required: false, additionalProperties: false };

/** A part of the data a subschema applies to, see `PART_OF_KEYWORD`: the properties whose names `test` takes, written
 * as one `name`, as one `pattern`, or as the rest of them, which leaves those matching the `claimed` patterns to them;
 * the items from `from` up to but not including `to`; what a subschema under `keyword` applies to, such as the
 * property names for a `propertyNames`; or `nothing`, for a subschema the keywords beside it leave nothing to
 */
type Part =
  | {
      readonly kind: 'properties';
      readonly test: (name: string) => boolean;
      readonly name?: string;
      readonly pattern?: string;
      readonly claimed: ReadonlySet<string>;
    }
  | { readonly kind: 'items'; readonly from: number; readonly to: number }
  | { readonly kind: 'keyword'; readonly keyword: string }
  | { readonly kind: 'nothing' };

/** Returns the part `PART_OF_KEYWORD` names a subschema by, from the key `entry` it is held under, if any, the
 * subschema `beside` holding it, and the `evaluators` whose evaluated parts an unevaluated keyword of that subschema
 * sees besides its own, see `evaluatorsOf()`
 */
type PartOf = (
  entry: string | undefined,
  beside: GenericObjectType,
  evaluators: () => readonly GenericObjectType[],
) => Part;

/** The part of a subschema that applies to no part of the data */
const NOTHING: Part = { kind: 'nothing' };

/** Returns the names the keyword `keyword` of the subschema `beside` holds its subschemas under, none where it holds
 * no map of them
 */
function namesIn(beside: GenericObjectType, keyword: string): string[] {
  const value: unknown = beside[keyword];
  return isObject(value) ? Object.keys(value) : [];
}

/** Returns the length of the tuple the keyword `keyword` of the subschema `beside` holds, or undefined where it holds
 * none, as an `items` holding one subschema does
 */
function tupleLength(beside: GenericObjectType, keyword: string): number | undefined {
  const value: unknown = beside[keyword];
  return Array.isArray(value) ? value.length : undefined;
}

/** The claims of a part that leaves no property to others */
const NO_CLAIMS: ReadonlySet<string> = new Set();

/** Returns the properties a `patternProperties` entry `pattern` applies to, none where no flag compiles it, as
 * `compiledPattern()` reads it
 */
function propertiesMatching(pattern: string): Part {
  const compiled = compiledPattern(pattern);
  return { kind: 'properties', pattern, claimed: NO_CLAIMS, test: (name) => compiled.some((one) => one.test(name)) };
}

/** Returns the properties the `properties` and `patternProperties` of the subschemas `besides` leave, which for an
 * `additionalProperties` is the subschema holding it
 */
function propertiesLeft(besides: readonly GenericObjectType[]): Part {
  const names = new Set(besides.flatMap((beside) => namesIn(beside, PROPERTIES_KEY)));
  const patterns = besides.flatMap((beside) => namesIn(beside, PATTERN_PROPERTIES_KEY));
  const compiled = patterns.flatMap(compiledPattern);
  return {
    kind: 'properties',
    claimed: new Set(patterns),
    test: (name) => !names.has(name) && !compiled.some((one) => one.test(name)),
  };
}

/** Returns the items from `from` on */
function itemsFrom(from: number): Part {
  return { kind: 'items', from, to: Infinity };
}

/** Returns the properties an `unevaluatedProperties` of the subschema `beside` applies to: none where an
 * `additionalProperties` beside it, or one or an `unevaluatedProperties` of its `evaluators`, evaluates every property,
 * and otherwise those the `properties` and `patternProperties` of all of them leave
 */
function propertiesUnevaluated(beside: GenericObjectType, evaluators: readonly GenericObjectType[]): Part {
  return ADDITIONAL_PROPERTIES_KEY in beside ||
    evaluators.some((one) => ADDITIONAL_PROPERTIES_KEY in one || UNEVALUATED_PROPERTIES_KEY in one)
    ? NOTHING
    : propertiesLeft([beside, ...evaluators]);
}

/** Returns whether the `items` of the subschema `beside` evaluates every item, as one subschema does, or as a tuple
 * does along with an `additionalItems`
 */
function evaluatesEveryItem(beside: GenericObjectType): boolean {
  const tuple = tupleLength(beside, ITEMS_KEY);
  return (ITEMS_KEY in beside && tuple === undefined) || (tuple !== undefined && ADDITIONAL_ITEMS_KEY in beside);
}

/** Returns the items an `unevaluatedItems` of the subschema `beside` applies to: none where it or one of its
 * `evaluators` evaluates every item, see `evaluatesEveryItem()`, or one of its `evaluators` holds an
 * `unevaluatedItems`, and otherwise those after the longest of their tuples
 */
function itemsLeft(beside: GenericObjectType, evaluators: readonly GenericObjectType[]): Part {
  if (evaluatesEveryItem(beside) || evaluators.some((one) => evaluatesEveryItem(one) || UNEVALUATED_ITEMS_KEY in one)) {
    return NOTHING;
  }
  const tuples = [beside, ...evaluators].flatMap((one) => [
    tupleLength(one, PREFIX_ITEMS_KEY) ?? 0,
    tupleLength(one, ITEMS_KEY) ?? 0,
  ]);
  return itemsFrom(Math.max(...tuples));
}

/** Returns the item at `index` of a tuple */
function itemAt(index: string | undefined): Part {
  return { kind: 'items', from: Number(index), to: Number(index) + 1 };
}

/** The keywords whose subschemas apply to a part of the data rather than to all of it, each with how to read the part:
 * a property by the name it is held under, the properties a pattern matches, the properties left by those beside it,
 * the properties `propertiesUnevaluated()` leaves to an `unevaluatedProperties`, a tuple's item by its index, the items
 * after a tuple from its length on, which an `additionalItems` with no tuple beside it applies to none of, and the
 * items `itemsLeft()` leaves to an `unevaluatedItems`
 */
const PART_OF_KEYWORD = new Map<string, PartOf>([
  [
    PROPERTIES_KEY,
    (entry) => ({ kind: 'properties', name: String(entry), claimed: NO_CLAIMS, test: (name) => name === entry }),
  ],
  [PATTERN_PROPERTIES_KEY, (entry) => propertiesMatching(String(entry))],
  [ADDITIONAL_PROPERTIES_KEY, (_entry, beside) => propertiesLeft([beside])],
  [UNEVALUATED_PROPERTIES_KEY, (_entry, beside, evaluators) => propertiesUnevaluated(beside, evaluators())],
  [
    ITEMS_KEY,
    (entry, beside) => (entry === undefined ? itemsFrom(tupleLength(beside, PREFIX_ITEMS_KEY) ?? 0) : itemAt(entry)),
  ],
  [
    ADDITIONAL_ITEMS_KEY,
    (_entry, beside) => {
      const tuple = tupleLength(beside, ITEMS_KEY);
      return tuple === undefined ? NOTHING : itemsFrom(tuple);
    },
  ],
  [PREFIX_ITEMS_KEY, itemAt],
  [UNEVALUATED_ITEMS_KEY, (_entry, beside, evaluators) => itemsLeft(beside, evaluators())],
  [CONTAINS_KEY, () => itemsFrom(0)],
]);

/** The keywords of `PART_OF_KEYWORD` whose subschema read as `{}` only widens what the schema accepts, where a
 * `contains` read so would narrow it, as a `not` would
 */
const PART_KEYWORDS = new Set([...PART_OF_KEYWORD.keys()].filter((keyword) => keyword !== CONTAINS_KEY));

/** The keywords that read which parts of the data the subschemas applied beside them evaluate */
const EVALUATING_KEYWORDS = [UNEVALUATED_PROPERTIES_KEY, UNEVALUATED_ITEMS_KEY];

/** The keywords besides the `PART_KEYWORDS` whose subschemas a copy of the node holding them can read as `{}` and only
 * widen what it accepts: each applies on top of the others, as a `$ref` does
 */
const CONJUNCT_KEYWORDS = new Set([ALL_OF_KEY, THEN_KEY, ELSE_KEY, DEPENDENCIES_KEY, DEPENDENT_SCHEMAS_KEY]);

function loosens<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  node: ObjectNode<S>,
  loosening: Loosening,
): boolean {
  const { raw } = node;
  return (
    (loosening.required &&
      (REQUIRED_KEY in raw ||
        DEPENDENT_REQUIRED_KEY in raw ||
        Object.values(isObject(raw[DEPENDENCIES_KEY]) ? raw[DEPENDENCIES_KEY] : {}).some(Array.isArray))) ||
    (loosening.additionalProperties && raw[ADDITIONAL_PROPERTIES_KEY] === false) ||
    recursiveChoices(graph).holds(node.id)
  );
}

/** Where a copy `derive()` makes reads a subschema leading to a recursive choice, see `recursiveChoices()`, as less
 * than it is. A copy reached from the option only through keywords that a subschema read as less makes accept more,
 * see `PART_KEYWORDS` and `CONJUNCT_KEYWORDS`, cuts: `parts` within the option's scope, which is part of the option and
 * is copied, and `conjuncts` below a part of the data, where a subschema applied on top of the others is cut too. One
 * below any other keyword, such as a `oneOf` or a `not`, where reading a subschema as less would narrow what the option
 * accepts, cuts `none`.
 */
type Cut = 'none' | 'parts' | 'conjuncts';

/** Returns what scoring reads a subschema `recursiveChoices()` cuts as: the types `statedTypes()` reads it as taking,
 * which it accepts no more than, or undefined where they say none and nothing is left of it
 */
function cutTo<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): S | undefined {
  const types = statedTypes(graph, id);
  if (types === undefined) {
    return undefined;
  }
  return types.length === 0
    ? schemaOfBoolean(false, graph.rawRoot)
    : schemaFrom(graph.rawRoot, { type: types.length === 1 ? types[0] : types });
}

/** Returns the value the keyword `key` holds in a subschema reached at `place`, whose `$ref`s resolve against `base`,
 * with each subschema it holds replaced by what `leading` hands back for it, if anything, or else by `{ $ref }` naming
 * its place below `place`, or, for a subschema with no place, by what `unplaced` hands a validator for its node, looked
 * up under `base`, since an object reached in two resources is a node in each
 */
function pointed<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  key: string,
  value: unknown,
  place: Place,
  base: string,
  unplaced: (sub: unknown, id: NodeId) => unknown,
  leading?: (sub: unknown, id: NodeId, tokens: string[]) => unknown,
): unknown {
  const name = (sub: unknown, tokens: string[]) => {
    const id = isObject(sub) ? graph.byObject(sub, base) : undefined;
    if (id === undefined) {
      return sub;
    }
    return leading?.(sub, id, tokens) ?? (place === undefined ? unplaced(sub, id) : refAt(childPointer(place, tokens)));
  };
  const shape = keywordShape(key, value);
  if (shape === 'single') {
    return name(value, [key]);
  }
  if (shape === 'array' && Array.isArray(value)) {
    return value.map((sub, index) => name(sub, [key, String(index)]));
  }
  if (shape === 'map' && isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([entry, sub]) => [entry, name(sub, [key, entry])]));
  }
  return value;
}

/** What a copy `derive()` makes depends on besides its node, place, loosening and cut: whether each place it reaches
 * is on the way to it, by its `placeKey()`, and whether each node it reaches is above it, by its id, as the `path` and
 * `above` it is made with say, which decides whether that place or node is named rather than copied. The places and
 * nodes of the copy itself, which are on the way to and above what it reaches whatever it is reached along, are left
 * out.
 */
type Dependence = Map<string | NodeId, boolean>;

/** The copies `derive()` makes for one scoring target: `made`, the last made for each place, loosening and cut, with
 * what it depends on, see `Dependence`, and `shared`, those the target holds in more than one place
 */
interface Copies<S extends StrictRJSFSchema> {
  readonly made: Map<string, { readonly copy: S; readonly dependence: Dependence }>;
  readonly shared: Set<object>;
}

/** Returns a copy of the node `id` reached at `place` without what `loosening` drops, from the node and from the nodes
 * `scopeOf()` lists, a dropped `additionalProperties: false` turned into `true`. A `$ref` among them is read as JSON
 * Schema reads one, as an `allOf` entry beside the keywords next to it, since a pointer cannot subtract from what it
 * names. The subschemas under the copy's other keywords are named by `pointed()` at their places below `place`, so each
 * `$ref` below them resolves against the `$id`s above it there, and the copy drops its `$id`, which would rebase them.
 * One with no place, such as a property of an option a merge of two lists rebuilt in a resource of its own, is named
 * where the root holds its node, or else copied as well, keeping all it states: the validator would resolve the `$ref`s
 * of the subschema as written against the root rather than against that resource. A subschema reached again at a place
 * on the way to it, `path`, or below itself, `above`, which only a root holding itself through its own objects does, is
 * named rather than copied without end. Where `cutting` says the copy cuts, a part of the data leading to a recursive
 * choice, see `recursiveChoices()`, is read as what `cutTo()` keeps of it where it is cut or recurs in the cycle of the
 * node holding it, a level of the data below, or as `{}` where nothing is left of it, and is copied in turn otherwise,
 * as is a subschema applied on top of the others below the option's scope, which is left out where nothing is left of
 * it; one leading to no choice is named where the root holds it. A copy `copies` already holds that would be made the
 * same, as what it depends on says, is used again, and what the copy depends on is added to `dependence`.
 */
function derive<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  node: ObjectNode<S>,
  place: Place,
  loosening: Loosening,
  path: ReadonlySet<string>,
  above: ReadonlySet<NodeId>,
  cutting: Cut,
  copies: Copies<S>,
  dependence: Dependence,
): S {
  const { id } = node;
  const ownKey = placeKey(id, place);
  const innerPath = new Set(path).add(ownKey);
  const innerAbove = new Set(above).add(id);
  // Whether `key`, a place or a node, is on the way to or above the copy, which the copy depends on unless it is its own
  const holds = (key: string | NodeId) => {
    if (key !== ownKey && key !== id) {
      dependence.set(key, typeof key === 'string' ? path.has(key) : above.has(key));
    }
    return typeof key === 'string' ? innerPath.has(key) : innerAbove.has(key);
  };
  const choices = recursiveChoices(graph);
  // Below a part, a subschema is named where it leads to no recursive choice and the root holds it, read as what
  // `cutTo()` keeps of it where it is cut, and otherwise copied; undefined where nothing is left of it
  const sub = (value: unknown, child: NodeId | undefined, at: Place, viaRef: boolean, as: Loosening, below: Cut) => {
    const childNode = child === undefined ? undefined : graph.node(child);
    if (childNode?.kind !== 'schema') {
      return value;
    }
    if (below === 'conjuncts') {
      const lead = choices.leadOf(childNode.id);
      if (lead === undefined && (at !== undefined || pointerTo(graph, childNode.id) !== undefined)) {
        return targetAt(graph, childNode.id, at);
      }
      if (lead === 'cut') {
        return cutTo(graph, childNode.id);
      }
    }
    const childKey = placeKey(childNode.id, at);
    let copy: S;
    if (holds(childKey) || (!viaRef && holds(childNode.id))) {
      copy = targetAt(graph, childNode.id, at);
    } else {
      // A copy is made once per place, loosening, cut and what it depends on, so a part reached along many paths, as
      // definitions that each name the next twice over reach one, is copied once rather than once per path
      const childAbove = viaRef ? new Set<NodeId>() : innerAbove;
      const key = [childKey, as.required, as.additionalProperties, below].join(' ');
      let known = copies.made.get(key);
      if (
        known === undefined ||
        ![...known.dependence].every(
          ([reached, held]) =>
            (typeof reached === 'string' ? innerPath.has(reached) : childAbove.has(reached)) === held,
        )
      ) {
        const on: Dependence = new Map();
        known = { copy: derive(graph, childNode, at, as, innerPath, childAbove, below, copies, on), dependence: on };
        copies.made.set(key, known);
      } else {
        copies.shared.add(known.copy);
      }
      // What the copy of the child depends on, the copy of this node depends on too, but for this node itself
      for (const reached of known.dependence.keys()) {
        if (typeof reached === 'string' || !viaRef) {
          holds(reached);
        }
      }
      copy = known.copy;
    }
    return below === 'conjuncts' && Object.keys(copy).length === 0 ? undefined : copy;
  };
  const unplaced = (value: unknown, child: NodeId) =>
    pointerTo(graph, child) ?? sub(value, child, undefined, false, KEPT, 'none');
  const leading =
    cutting === 'none'
      ? undefined
      : (value: unknown, child: NodeId, tokens: string[]) => {
          if (choices.leadOf(child) === undefined) {
            return undefined;
          }
          // A part in the cycle of the node holding it is a level of the data below the copy of that level, and recurs
          const cycle = choices.cycleOf(id);
          const kept =
            cycle !== undefined && choices.cycleOf(child) === cycle
              ? cutTo(graph, child)
              : sub(value, child, placeBelow(place, tokens), false, KEPT, 'conjuncts');
          return kept ?? schemaOfBoolean(true, graph.rawRoot);
        };
  const conjunct = (value: unknown, child: NodeId | undefined, at: Place, viaRef = false) =>
    sub(value, child, at, viaRef, loosening, cutting);
  // The schema reads as a record of keywords, each of which is copied
  const {
    [ID_KEY]: _id,
    [REQUIRED_KEY]: required,
    [DEPENDENT_REQUIRED_KEY]: dependentRequired,
    [REF_KEY]: ref,
    [ALL_OF_KEY]: allOf,
    [THEN_KEY]: then,
    [ELSE_KEY]: otherwise,
    [DEPENDENCIES_KEY]: dependencies,
    [DEPENDENT_SCHEMAS_KEY]: dependentSchemas,
    ...rest
  } = node.raw as GenericObjectType;
  const copy: GenericObjectType = Object.fromEntries(
    Object.entries(rest).map(([key, value]) => [
      key,
      pointed(graph, key, value, place, node.baseUri, unplaced, PART_KEYWORDS.has(key) ? leading : undefined),
    ]),
  );
  if (!loosening.required && required !== undefined) {
    copy[REQUIRED_KEY] = required;
  }
  if (!loosening.required && dependentRequired !== undefined) {
    copy[DEPENDENT_REQUIRED_KEY] = dependentRequired;
  }
  const target = node.ref === undefined ? undefined : graph.node(node.ref);
  const resolved = target?.kind === 'invalid' ? undefined : target;
  const conjuncts = [
    ...(Array.isArray(allOf)
      ? allOf.map((entry, index) =>
          conjunct(entry, graph.child(id, ALL_OF_KEY, String(index)), placeBelow(place, [ALL_OF_KEY, String(index)])),
        )
      : []),
    ...(resolved === undefined
      ? []
      : [
          resolved.kind === 'schema'
            ? conjunct(resolved.raw, resolved.id, refPlace(node), true)
            : targetOf(graph, resolved.id),
        ]),
  ].filter((entry) => entry !== undefined);
  if (ref !== undefined && resolved === undefined) {
    copy[REF_KEY] = ref;
  }
  if (conjuncts.length > 0) {
    copy[ALL_OF_KEY] = conjuncts;
  }
  for (const [keyword, value] of [
    [THEN_KEY, then],
    [ELSE_KEY, otherwise],
  ] as const) {
    const kept =
      value === undefined ? undefined : conjunct(value, graph.child(id, keyword), placeBelow(place, [keyword]));
    if (kept !== undefined) {
      copy[keyword] = kept;
    }
  }
  for (const [keyword, value] of [
    [DEPENDENCIES_KEY, dependencies],
    [DEPENDENT_SCHEMAS_KEY, dependentSchemas],
  ] as const) {
    const kept = Object.entries(isObject(value) ? value : {}).flatMap(([key, dependency]) => {
      if (loosening.required && Array.isArray(dependency)) {
        return [];
      }
      const keptDependency = conjunct(dependency, graph.child(id, keyword, key), placeBelow(place, [keyword, key]));
      return keptDependency === undefined ? [] : [[key, keptDependency]];
    });
    if (kept.length > 0) {
      copy[keyword] = Object.fromEntries(kept);
    }
  }
  if (loosening.additionalProperties && copy[ADDITIONAL_PROPERTIES_KEY] === false) {
    copy[ADDITIONAL_PROPERTIES_KEY] = true;
  }
  return schemaFrom(graph.rawRoot, copy);
}

/** The start of the `$id` that names a copy a scoring target holds once, see `withSharedCopies()`. Only a query, it
 * resolves against the `$id` around it, so a `$ref` to the root, which a validator prefixes with the id it registers the
 * root under, resolves inside the copy as it does outside it, as long as that id names its document by no more than
 * its last path segment.
 */
export const SHARED_COPY_ID = '?rjsf-copy=';

/** Returns `target` with each of the `shared` copies it holds in more than one place written once, as a resource of its
 * own under the `definitions` of an `allOf` holding the target, and named by its `$id` wherever the target holds it.
 * Definitions that each name the next twice over reach the last along a number of paths that doubles with each level,
 * so a target writing the copy of it out at each would grow as fast, which no validator could compile. Each `$id` is
 * hashed from what the copy holds, so a target lists the same ids however the root holding it was reached, which a
 * precompiled validator finds it by; two copies hashing alike are told apart by a count.
 */
function withSharedCopies<S extends StrictRJSFSchema>(target: S, shared: ReadonlySet<object>): S {
  const written = new Map<object, unknown>();
  const contents = new Map<string, string>();
  const definitions: GenericObjectType = {};
  // An object holding no shared copy is kept as it is, so a subschema of the root the target holds is still the one
  // the graph knows, see `withRootIdRefPrefix()`
  const write = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      const items = value.map(write);
      return items.every((item, index) => item === value[index]) ? value : items;
    }
    if (!isObject(value)) {
      return value;
    }
    const known = written.get(value);
    if (known !== undefined) {
      return known;
    }
    const entries = Object.entries(value).map(([key, sub]) => [key, write(sub)] as const);
    if (!shared.has(value)) {
      const kept = entries.every(([key, sub]) => sub === value[key]) ? value : Object.fromEntries(entries);
      written.set(value, kept);
      return kept;
    }
    const content = Object.fromEntries(entries);
    const serialized = sortedJSONStringify(content);
    const hash = hashString(serialized);
    let name = hash;
    for (let n = 1; (contents.get(name) ?? serialized) !== serialized; n += 1) {
      name = `${hash}-${n}`;
    }
    contents.set(name, serialized);
    const id = `${SHARED_COPY_ID}${name}`;
    // A draft-07 `$ref` ignores the `$id` beside it, so a copy holding one is held by the resource instead
    definitions[name] = REF_KEY in content ? { [ID_KEY]: id, [ALL_OF_KEY]: [content] } : { [ID_KEY]: id, ...content };
    const ref = { [REF_KEY]: id };
    written.set(value, ref);
    return ref;
  };
  return schemaFrom(target, { [ALL_OF_KEY]: [write(target)], [DEFINITIONS_KEY]: definitions });
}

/** Returns what the `anyOf`/`oneOf` option `id` reached at `place` is scored with: `{ $ref }` naming the place, or,
 * where something in its scope states a `required`, lists names under `dependencies`, holds a part leading to a
 * recursive choice, see `recursiveChoices()`, or, with `relax`, sets `additionalProperties: false`, the copy `derive()`
 * makes without them. A user who has yet to fill in a key the option requires is still matched to it. The `required`s
 * are kept where nothing in the scope `holdsDeclaredKey()` reads, which leaves out `dependentSchemas` entries, declares
 * `properties`: an option such as `{ required: ['email'] }` describes nothing else for the data to fit, and is chosen
 * by the keys it requires, where no declared key it holds stands in for them.
 */
function scoringTargetAt<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  place: Place,
  relax: boolean,
): S {
  const node = graph.node(id);
  if (node.kind !== 'schema') {
    return targetOf(graph, id);
  }
  const scope = scopeAt(graph, id, undefined, 'scored');
  const loosening = {
    required: scope.some(({ node: member, dependent }) => !dependent && isObject(member.raw.properties)),
    additionalProperties: relax,
  };
  return place !== undefined && !scope.some(({ node: member }) => loosens(graph, member, loosening))
    ? targetAt(graph, id, place)
    : scoringCopy(graph, node, place, loosening);
}

/** Returns the copy `derive()` makes of the option `node` reached at `place`, each part it reaches along several paths
 * written once, see `withSharedCopies()`
 */
function scoringCopy<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  node: ObjectNode<S>,
  place: Place,
  loosening: Loosening,
): S {
  const copies: Copies<S> = { made: new Map(), shared: new Set() };
  const copy = derive(graph, node, place, loosening, new Set(), new Set(), 'parts', copies, new Map());
  return copies.shared.size === 0 ? copy : withSharedCopies(copy, copies.shared);
}

/** Returns what an `anyOf`/`oneOf` option is scored with, see `scoringTargetAt()`, the option named where the root
 * holds it as an option. The schema depends on the root, the node and `relax` alone, so a precompiled validator finds
 * it under the key it was compiled under.
 *
 * @param graph - The graph of the root
 * @param id - The option's node
 * @param relax - Whether an `additionalProperties: false` is relaxed too, as pruning extra data relaxes it
 * @returns - The schema to score the option with
 */
export function scoringTarget<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  relax: boolean,
): S {
  const keys = [graph, id, relax];
  const memoized = scoringTargets.peek(keys);
  if (isSchemaObject<S>(memoized)) {
    return memoized;
  }
  const target = scoringTargetAt(graph, id, optionPlace(graph, id), relax);
  scoringTargets.set(keys, target);
  return target;
}

/** The schemas `scoringTarget()` returns, per graph, node and `relax`: an option is matched on every edit, and a
 * validator hashes a schema it is handed to find what it compiled for it
 */
const scoringTargets = new KeyedMemo<object>();

/** What of an option's scope `holdsDeclaredKey()` reads: the names and patterns its `properties` and
 * `patternProperties` declare, or the answer, where it does not depend on the data
 */
type DeclaredKeys = boolean | { readonly names: ReadonlySet<string>; readonly patterns: readonly RegExp[] };

/** The `DeclaredKeys` of each option, per graph, node and whether an absent `additionalProperties` takes extra keys */
const declaredKeysMemo = new KeyedMemo<DeclaredKeys>();

function declaredKeys<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  graph: SchemaGraph<S>,
  id: NodeId,
): DeclaredKeys {
  return declaredKeysMemo.get([graph, id, readsAbsentAsAllowed<S, F>(context)], () =>
    readDeclaredKeys(context, graph, id),
  );
}

/** Returns `pattern` compiled, or nothing for one no flag compiles. Matching asks of each option whether it fits the
 * data, and a validator reads an option holding such a pattern as one that fits nothing, so the pattern names no key
 * rather than taking every option match down with it.
 */
function compiledPattern(pattern: string): RegExp[] {
  try {
    return [patternRegExp(pattern)];
  } catch {
    return [];
  }
}

function readDeclaredKeys<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  graph: SchemaGraph<S>,
  id: NodeId,
): DeclaredKeys {
  const scope = scopeOf(graph, id);
  const declaring = scope.flatMap((node) => (isObject(node.raw.properties) ? [Object.keys(node.raw.properties)] : []));
  if (declaring.length === 0) {
    return true;
  }
  const names = new Set(declaring.flat());
  if (names.size === 0) {
    return scope.some((node) => allowsAdditionalProperties<S, F>(context, node.raw));
  }
  const patterns = scope
    .flatMap((node) => graph.subschemas(node.id, PATTERN_PROPERTIES_KEY))
    .flatMap(([pattern]) => compiledPattern(pattern));
  return { names, patterns };
}

/** Returns whether the object `data` holds a key the option `id` declares, which scoring asks on top of the option's
 * schema: an object validates against an object option whatever keys it holds, as long as none conflicts, so without
 * it a "none of these" option would take every object. A key counts when a `properties` or `patternProperties` in the
 * option's scope names it and it holds a value. An option declaring no `properties` is not asked; one whose
 * `properties` name nothing matches only where it takes extra keys, and then whatever the data holds.
 *
 * @param context - The `SchemaContext` whose `additionalPropertiesWhenAbsent` says whether an option naming no
 *        `additionalProperties` takes extra keys
 * @param graph - The graph of the root
 * @param id - The option's node
 * @param data - The data being matched
 * @returns - Whether the option can match the data
 */
export function holdsDeclaredKey<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  graph: SchemaGraph<S>,
  id: NodeId,
  data: unknown,
): boolean {
  const declared = declaredKeys(context, graph, id);
  if (typeof declared === 'boolean') {
    return declared;
  }
  const { names, patterns } = declared;
  // A key holding `undefined`, as an option switch leaves the keys of the option before it, is one JSON has no value
  // for, which a validator's `required` reads as missing too
  return (
    !isObject(data) ||
    Object.entries(data).some(
      ([key, value]) => value !== undefined && (names.has(key) || patterns.some((pattern) => pattern.test(key))),
    )
  );
}

/** The subschemas `childrenOf()` lists, per graph, by node: the walk of `recursiveChoices()`, `evaluatorsOf()` and
 * `childrenLeadingToTargets()` each read them for the same nodes
 */
const childrenMemo = new KeyedMemo<(readonly [string[], NodeId][])[]>();

/** Returns the subschemas the node `id` holds, each with the unescaped pointer tokens leading to it */
function childrenOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): readonly [string[], NodeId][] {
  // A graph extending another holds the base's nodes as the base does, so their lists are the base's
  if (graph.base !== undefined && id < graph.base.size) {
    return childrenOf(graph.base, id);
  }
  const held = childrenMemo.get([graph], () => []);
  held[id] ??= readChildren(graph, id);
  return held[id];
}

function readChildren<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): [string[], NodeId][] {
  const node = graph.node(id);
  if (node.kind !== 'schema') {
    return [];
  }
  return Object.keys(node.raw).flatMap((key): [string[], NodeId][] => {
    const single = graph.child(id, key);
    return single === undefined
      ? graph.subschemas(id, key).map(([entry, child]) => [[key, entry], child])
      : [[[key], single]];
  });
}

/** The keywords holding the subschemas `reachedFrom()` reaches */
const REACHING_KEYWORDS = new Set([IF_KEY, ANY_OF_KEY, ONE_OF_KEY, DEPENDENCIES_KEY]);

/** The keywords holding subschemas a validator applies only where a `$ref` names one */
const DEFINITIONS_KEYWORDS = new Set(CONTAINER_KEYWORDS);

/** Returns the types both `types` and `others` allow, undefined allowing any */
function intersectTypes(
  types: readonly string[] | undefined,
  others: readonly string[] | undefined,
): readonly string[] | undefined {
  if (types === undefined || others === undefined) {
    return types ?? others;
  }
  return types.filter((type) => others.includes(type));
}

/** Returns the types either `types` or `others` allows, undefined allowing any */
function uniteTypes(
  types: readonly string[] | undefined,
  others: readonly string[] | undefined,
): readonly string[] | undefined {
  return types === undefined || others === undefined ? undefined : [...new Set([...types, ...others])];
}

/** The types `statedTypes()` has read the nodes of a graph as taking, per graph: those of every node it has reached */
const statedTypesMemo = new KeyedMemo<Map<NodeId, readonly string[] | undefined>>();

/** Returns whether `types` and `others` allow the same types, undefined allowing any */
function sameTypes(types: readonly string[] | undefined, others: readonly string[] | undefined): boolean {
  if (types === undefined || others === undefined) {
    return types === others;
  }
  return types.length === others.length && types.every((type) => others.includes(type));
}

/** Returns the types of value the node `id` takes, an `integer` read as a `number`, as its `type`, which a `nullable:
 * true` beside it lets take `null` too, its `const` and its `enum` say, along with what its `$ref` and `allOf` apply on
 * top of it and the options of its `anyOf` and `oneOf` take, or undefined where none of them limits the type. They are
 * listed in alphabetical order, whatever order the keywords list them in, so the `type` `cutTo()` writes for a node, by
 * which a precompiled validator finds the cut's validator, is the same however the node was reached. Where
 * these apply to the same value in a cycle, each node of the cycle takes the most types the others let it, whichever of
 * them is read first: every node starts out taking any, and is read again whenever a node it applies changes, which, a
 * node only ever losing types, ends. A graph extending another adds nodes above the base's, which the base's never
 * apply, so the base's types stand and are read from it.
 */
function statedTypes<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): readonly string[] | undefined {
  const { base } = graph;
  if (base !== undefined && id < base.size) {
    return statedTypes(base, id);
  }
  const known = statedTypesMemo.get([graph], () => new Map());
  if (!known.has(id)) {
    readTypesFrom(graph, id, known);
  }
  return known.get(id);
}

/** Reads into `known` the types of the node `id` and of every node it applies that no earlier read reached, see
 * `statedTypes()`. What a node takes depends only on the nodes it applies, so the nodes an earlier read settled stand,
 * and only the nodes reached here are read again as they change.
 */
function readTypesFrom<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  known: Map<NodeId, readonly string[] | undefined>,
): void {
  const { base } = graph;
  const start = base?.size ?? 0;
  const typesAt = (at: NodeId) => (base !== undefined && at < start ? statedTypes(base, at) : known.get(at));
  const appliedBy = new Map<NodeId, NodeId[]>();
  const reads: (() => readonly string[] | undefined)[] = [];
  const pending: NodeId[] = [];
  known.set(id, undefined);
  const entering = [id];
  for (let at = entering.pop(); at !== undefined; at = entering.pop()) {
    const node = graph.node(at);
    if (node.kind === 'schema') {
      const { type, nullable, [CONST_KEY]: constant, [ENUM_KEY]: values } = node.raw as GenericObjectType;
      // Each list is deduplicated: a `type` naming `integer` and `number`, or an `enum` of two strings, would
      // otherwise hand a cut a `type` repeating an entry, which the meta-schema rejects. Ajv reads the OpenAPI
      // `nullable: true` as letting the `type` beside it take `null` too, and a validator that ignores it accepts
      // no less for the `null` a cut adds
      const stated = [
        ...(type === undefined
          ? []
          : [
              [
                ...(Array.isArray(type) ? type : [type]).map((one) => (one === 'integer' ? 'number' : String(one))),
                ...(nullable === true ? ['null'] : []),
              ],
            ]),
        ...(constant === undefined ? [] : [[guessType(constant)]]),
        ...(Array.isArray(values) ? [values.map(guessType)] : []),
      ].map((types) => [...new Set(types)]);
      const conjuncts = [
        ...(node.ref === undefined ? [] : [node.ref]),
        ...graph.subschemas(at, ALL_OF_KEY).map(([, entry]) => entry),
      ];
      const choices = [ANY_OF_KEY, ONE_OF_KEY]
        .map((keyword) => graph.subschemas(at, keyword).map(([, option]) => option))
        .filter((options) => options.length > 0);
      for (const child of [...conjuncts, ...choices.flat()].filter((applied) => applied >= start)) {
        if (!known.has(child)) {
          known.set(child, undefined);
          entering.push(child);
        }
        const holders = appliedBy.get(child);
        if (holders === undefined) {
          appliedBy.set(child, [at]);
        } else {
          holders.push(at);
        }
      }
      reads[at] = () =>
        [
          ...stated,
          ...conjuncts.map(typesAt),
          ...choices.map((options) => options.map(typesAt).reduce<readonly string[] | undefined>(uniteTypes, [])),
        ].reduce<readonly string[] | undefined>(intersectTypes, undefined);
      pending.push(at);
    }
  }
  for (let at = pending.pop(); at !== undefined; at = pending.pop()) {
    const types = reads[at]()?.toSorted();
    if (!sameTypes(types, known.get(at))) {
      known.set(at, types);
      pending.push(...(appliedBy.get(at) ?? []));
    }
  }
}

/** Returns whether a value can be of a type both `types` and `others` allow */
function typesOverlap(types: readonly string[] | undefined, others: readonly string[] | undefined): boolean {
  return types === undefined || others === undefined || types.some((type) => others.includes(type));
}

/** The keywords whose subschemas apply to the same value as the subschema holding them, rather than to a part of it */
const SAME_VALUE_KEYWORDS = new Set([
  DEPENDENT_SCHEMAS_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  ONE_OF_KEY,
  NOT_KEY,
  IF_KEY,
  THEN_KEY,
  ELSE_KEY,
  DEPENDENCIES_KEY,
]);

/** Returns the part of the data a subschema the keyword `keyword` of the subschema `beside` holds under `entry`
 * applies to, see `Part`
 */
function partOf(
  keyword: string,
  entry: string | undefined,
  beside: GenericObjectType,
  evaluators: () => readonly GenericObjectType[],
): Part {
  return PART_OF_KEYWORD.get(keyword)?.(entry, beside, evaluators) ?? { kind: 'keyword', keyword };
}

/** Returns the subschemas applied on top of a node, whose evaluated parts an `unevaluatedProperties` or
 * `unevaluatedItems` of the node sees: what it holds under `CONJUNCT_KEYWORDS`, of the subschemas it holds, `held`,
 * and what its `$ref`, `ref`, names. `evaluatorsOf()` and the walk of `recursiveChoices()` both read them, and have to
 * agree on what an unevaluated keyword sees.
 */
function conjunctsOf(held: readonly [string[], NodeId][], ref: NodeId | undefined): NodeId[] {
  return [
    ...held.filter(([[keyword]]) => CONJUNCT_KEYWORDS.has(keyword)).map(([, child]) => child),
    ...(ref === undefined ? [] : [ref]),
  ];
}

/** What `evaluatorsOf()` found, per graph and node */
const evaluatorsMemo = new KeyedMemo<readonly GenericObjectType[]>();

/** Returns the keywords of the subschemas whose evaluated parts an `unevaluatedProperties` or `unevaluatedItems` of the
 * node `id` sees besides its own, however deep: what its `$ref` names and what it holds under `CONJUNCT_KEYWORDS`. Its
 * `anyOf`/`oneOf` options, `if` and `contains` are left out: a part one of them walks without passing, which leaves
 * the node to pass, is walked again by the unevaluated keyword, where a conjunct that fails fails the node.
 */
function evaluatorsOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): readonly GenericObjectType[] {
  return evaluatorsMemo.get([graph, id], () => readEvaluators(graph, id));
}

function readEvaluators<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): GenericObjectType[] {
  const evaluators: GenericObjectType[] = [];
  const seen = new Set([id]);
  const pending = [id];
  for (let at = pending.pop(); at !== undefined; at = pending.pop()) {
    const node = graph.node(at);
    const raw: unknown = node.kind === 'schema' ? node.raw : undefined;
    if (at !== id && isObject(raw)) {
      evaluators.push(raw);
    }
    for (const child of conjunctsOf(childrenOf(graph, at), node.kind === 'schema' ? node.ref : undefined)) {
      if (!seen.has(child)) {
        seen.add(child);
        pending.push(child);
      }
    }
  }
  return evaluators;
}

/** Returns whether the properties `others` names are all left by the patterns `part` claims */
function leftTo(part: Part & { kind: 'properties' }, others: Part & { kind: 'properties' }): boolean {
  return others.pattern !== undefined && part.claimed.has(others.pattern);
}

/** Returns whether the parts `part` and `other` can hold the same value: a property both apply to, which for two parts
 * naming no one property is any, unless one leaves the other's pattern to it; an item both ranges hold; or the same
 * keyword's part
 */
function partsMeet(part: Part, other: Part): boolean {
  if (part.kind === 'properties' && other.kind === 'properties') {
    if (part.name !== undefined) {
      return other.test(part.name);
    }
    return other.name === undefined ? !leftTo(part, other) && !leftTo(other, part) : part.test(other.name);
  }
  if (part.kind === 'items' && other.kind === 'items') {
    return part.from < other.to && other.from < part.to;
  }
  return part.kind === 'keyword' && other.kind === 'keyword' && part.keyword === other.keyword;
}

/** Returns whether a part `parts` names and one `others` names can be the same part of the data */
function partsOverlap(parts: readonly Part[], others: readonly Part[]): boolean {
  return parts.some((part) => others.some((other) => partsMeet(part, other)));
}

/** A node of a cycle `branchingNodes()` reads: the subschemas it holds, see `childrenOf()`, and its keywords */
interface CycleMember {
  readonly held: readonly [string[], NodeId][];
  readonly beside: GenericObjectType;
}

/** What of a value one subschema applying to it validates again with a subschema of its cycle: the types of value it
 * takes, and the parts of the value it holds the cycle again through
 */
interface Recurrence {
  readonly types: readonly string[] | undefined;
  readonly parts: readonly Part[];
}

/** Returns the nodes of the cycle `cycle`, each with the subschemas it holds, that validate a value with two or more
 * subschemas that hold the cycle again through the same part of the value, so validating data walks that part more than
 * once at every level it recurs at, which grows exponentially with the depth of the data. Its `allOf` entries, `$ref`,
 * `not`, `if`, `dependencies` and `dependentSchemas` schemas and each of its own parts apply to the value together, its
 * `then` or its `else` with them, and its `anyOf`/`oneOf` options do where they can take a value of the same type: the
 * array and the object of a JSON value written as an `anyOf` of a string, an array of values and an object of values
 * fail on `type` alone. Subschemas recurring through different parts, as an `allOf` of a base holding the node again as
 * a `parent` and an object holding it as `children` does, or a property and a pattern that cannot match its name, walk
 * each part of the data once.
 */
function branchingNodes<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  cycle: ReadonlyMap<NodeId, CycleMember>,
): Set<NodeId> {
  const walked = new Map<NodeId, readonly Part[]>();
  // The parts of the value through which the node `id` of the cycle, or a node of the cycle it applies to the same
  // value however deep, holds the cycle again, walked once per node
  const partsOf = (id: NodeId): readonly Part[] => {
    const known = walked.get(id);
    if (known !== undefined) {
      return known;
    }
    const parts: Part[] = [];
    const sameValue = new Map<NodeId, CycleMember>();
    const reach = (at: NodeId) => {
      const member = cycle.get(at);
      if (member !== undefined && !sameValue.has(at)) {
        sameValue.set(at, member);
      }
    };
    reach(id);
    // A map iterator reads the nodes added while it runs
    for (const [at, { held, beside }] of sameValue) {
      held.forEach(([[keyword, entry], child]) => {
        if (!cycle.has(child) || DEFINITIONS_KEYWORDS.has(keyword)) {
          return;
        }
        if (SAME_VALUE_KEYWORDS.has(keyword)) {
          reach(child);
        } else {
          parts.push(partOf(keyword, entry, beside, () => evaluatorsOf(graph, at)));
        }
      });
      const node = graph.node(at);
      if (node.kind === 'schema' && node.ref !== undefined) {
        reach(node.ref);
      }
    }
    walked.set(id, parts);
    return parts;
  };
  const recurrence = (keyword: string, child: NodeId): Recurrence => ({
    types: keyword === NOT_KEY || keyword === IF_KEY ? undefined : statedTypes(graph, child),
    parts: partsOf(child),
  });
  return new Set(
    [...cycle].flatMap(([id, { held, beside }]) => {
      const node = graph.node(id);
      const applying = held.filter(
        ([[keyword], child]) =>
          cycle.has(child) && SAME_VALUE_KEYWORDS.has(keyword) && keyword !== THEN_KEY && keyword !== ELSE_KEY,
      );
      const branches = held
        .filter(([[keyword], child]) => cycle.has(child) && (keyword === THEN_KEY || keyword === ELSE_KEY))
        .map(([[keyword], child]) => recurrence(keyword, child));
      const types = statedTypes(graph, id);
      const own = held
        .filter(
          ([[keyword], child]) =>
            cycle.has(child) && !SAME_VALUE_KEYWORDS.has(keyword) && !DEFINITIONS_KEYWORDS.has(keyword),
        )
        .map(([[keyword, entry]]): Recurrence => ({
          types,
          parts: [partOf(keyword, entry, beside, () => evaluatorsOf(graph, id))],
        }));
      const recurrences: Recurrence[] = [
        ...own,
        ...applying.map(([[keyword], child]) => recurrence(keyword, child)),
        ...(node.kind === 'schema' && node.ref !== undefined && cycle.has(node.ref)
          ? [recurrence(REF_KEY, node.ref)]
          : []),
        ...(branches.length === 0
          ? []
          : [
              {
                types: branches.map((branch) => branch.types).reduce<readonly string[] | undefined>(uniteTypes, []),
                parts: branches.flatMap((branch) => branch.parts),
              },
            ]),
      ];
      return recurrences.some((one, index) =>
        recurrences
          .slice(index + 1)
          .some((other) => typesOverlap(one.types, other.types) && partsOverlap(one.parts, other.parts)),
      )
        ? [id]
        : [];
    }),
  );
}

/** A node the walk of `recursiveChoices()` has entered: the order it was entered in, the lowest order of a node still
 * open that it holds however deep, the subschemas it holds, those a validator applies with it, see
 * `DEFINITIONS_KEYWORDS`, along with what its `$ref` names and the conjunction it reads as, and those left to follow
 */
interface Frame {
  readonly id: NodeId;
  readonly order: number;
  low: number;
  readonly held: readonly [string[], NodeId][];
  /** Its keywords, none for a boolean */
  readonly beside: GenericObjectType;
  readonly applied: NodeId[];
  readonly next: NodeId[];
  /** The subschemas applied on top of it, see `conjunctsOf()` */
  readonly conjuncts: NodeId[];
  /** Its `conjuncts`, whose evaluated parts an `unevaluatedProperties` or `unevaluatedItems` it holds sees, or none
   * where it holds neither
   */
  readonly evaluated: NodeId[];
}

/** What scoring makes of a subschema leading to a recursive choice: `cut`, where it leads to the choice, or recurs with
 * it, through a keyword that a copy of it reading the subschema there as less would narrow, such as an `if` or a
 * `oneOf`, or `copied`, with what it leads through read so
 */
type Lead = 'cut' | 'copied';

/** The recursive choices of a graph, see `recursiveChoices()` */
interface RecursiveChoices {
  /** Returns what scoring makes of the node `id`, or undefined where no recursive choice is reached from it */
  leadOf(id: NodeId): Lead | undefined;
  /** Returns the cycle the node `id` recurs in along with a recursive choice, named by one of its nodes, if it does */
  cycleOf(id: NodeId): NodeId | undefined;
  /** Returns whether the node `id` holds a part of the data, see `PART_KEYWORDS`, that leads to a recursive choice */
  holds(id: NodeId): boolean;
  /** Returns whether a copy of the node `id` below a part evaluates fewer parts of the data than the node does: where
   * it is `cut`, or a subschema applied on top of it is, however deep, which an `unevaluatedProperties` or
   * `unevaluatedItems` above it would then see less of
   */
  narrows(id: NodeId): boolean;
}

/** The `RecursiveChoices` of each graph */
const recursiveChoicesMemo = new KeyedMemo<RecursiveChoices>();

/** Returns the nodes of `graph` from which a validator reaches a recursive choice, see `branchingNodes()`, however
 * deep and through any `$ref` but not through definitions, and those holding a part of the data that does. Validating
 * data against such a choice walks each of its recurring branches at every level of the data, which grows
 * exponentially with the depth of the data where definitions offer each other as options. A choice with one recurring
 * branch, such as a tree written as an `anyOf` of a leaf and a list of trees, or one that recurs nowhere, such as an
 * OpenAPI nullable `anyOf` of a `$ref` and `null`, costs no more than the data below it. Only what recurs along with
 * the choice needs cutting to stop the walk: a node leading to it, such as an object holding the choice in a property,
 * can be copied with that property cut, and keeps checking the rest, as can a node of the cycle entered from outside
 * it, with what recurs below it cut.
 *
 * @param graph - The graph
 * @returns - What scoring makes of the nodes that lead to a recursive choice
 */
function recursiveChoices<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>): RecursiveChoices {
  return recursiveChoicesMemo.get([graph], () => {
    // A graph extending another adds nodes above the base's, which the base's never hold, so what was found for the
    // base stands, and is read from it
    const start = graph.base?.size ?? 0;
    const base = graph.base === undefined ? undefined : recursiveChoices(graph.base);
    const walk = recursiveChoicesWalk(graph, start, base);
    // A node below `start` is read from `base` and any other from the walk. The four reads below and the two
    // `walkFrom()` makes mid-walk, for `leads` and `narrowing`, keep to that one rule: a change to it changes all six
    return {
      leadOf: (id) => (id < start ? base?.leadOf(id) : walk(id).leads.get(id)),
      cycleOf: (id) => (id < start ? base?.cycleOf(id) : walk(id).cycles.get(id)),
      holds: (id) => (id < start ? base?.holds(id) === true : walk(id).holders.has(id)),
      narrows: (id) => (id < start ? base?.narrows(id) === true : walk(id).narrowing.has(id)),
    };
  });
}

/** What `recursiveChoicesWalk()` has found for the nodes of a graph it has walked, see `RecursiveChoices`, and those
 * nodes
 */
interface FoundChoices {
  readonly leads: Map<NodeId, Lead>;
  readonly cycles: Map<NodeId, NodeId>;
  readonly holders: Set<NodeId>;
  readonly narrowing: Set<NodeId>;
  readonly walked: Set<NodeId>;
}

/** Returns a walk that finds what `recursiveChoices()` reads for a node of `graph` from `start` on, those below read
 * from `base`, walking only what the node reaches that no earlier walk did. What a node leads to depends only on what
 * it reaches, so a schema whose options reach no cycle, such as most of a large OpenAPI document, is never walked as a
 * whole. Between walks it keeps what it found and the nodes it has walked; the state of each walk is its own, and is
 * freed once it ends.
 */
function recursiveChoicesWalk<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  start: number,
  base: RecursiveChoices | undefined,
): (id: NodeId) => Readonly<FoundChoices> {
  const found: FoundChoices = {
    leads: new Map(),
    cycles: new Map(),
    holders: new Set(),
    narrowing: new Set(),
    walked: new Set(),
  };
  return (root) => {
    if (!found.walked.has(root)) {
      walkFrom(graph, start, base, root, found);
    }
    return found;
  };
}

/** Walks `graph` from the node `root`, adding what it finds for each node it walks to `found`, see
 * `recursiveChoicesWalk()`. Tarjan's strongly connected components, run on a stack of frames rather than by recursion:
 * it enters every node `root` reaches, however long a chain of `$ref`s a generated schema holds, where only a copy
 * `derive()` makes recurses, as deep as the copy, as `retrieveSchema()` does. It closes a component after every
 * component it holds, so whether that leads to a recursive choice is known by then. A node an earlier walk closed is
 * not entered again.
 */
function walkFrom<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  start: number,
  base: RecursiveChoices | undefined,
  root: NodeId,
  found: FoundChoices,
): void {
  const { leads, cycles, holders, narrowing, walked } = found;
  // A node closes once every subschema it applies has been entered, so what those lead to is known by then. A node
  // below `start` is read from `base`, by the rule `recursiveChoices()` keeps to
  const leadOf = (id: NodeId) => (id < start ? base?.leadOf(id) : leads.get(id));
  const narrows = (id: NodeId) => (id < start ? base?.narrows(id) === true : narrowing.has(id));
  const open = new Map<NodeId, number>();
  const stack: Frame[] = [];
  const frames: Frame[] = [];
  let entered = 0;
  const enter = (id: NodeId) => {
    const order = entered;
    entered += 1;
    const node = graph.node(id);
    const raw: unknown = node.kind === 'schema' ? node.raw : undefined;
    const held = childrenOf(graph, id);
    const applied = [
      ...held.filter(([[keyword]]) => !DEFINITIONS_KEYWORDS.has(keyword)).map(([, child]) => child),
      ...(node.kind === 'schema' ? [node.ref, node.conjunction].filter((ref) => ref !== undefined) : []),
    ];
    const conjuncts = node.kind === 'schema' ? conjunctsOf(held, node.ref) : [];
    const evaluated =
      node.kind === 'schema' && EVALUATING_KEYWORDS.some((keyword) => keyword in node.raw) ? conjuncts : [];
    const frame = {
      id,
      order,
      low: order,
      held,
      beside: isObject(raw) ? raw : {},
      applied,
      next: applied.filter((child) => child >= start),
      conjuncts,
      evaluated,
    };
    open.set(id, order);
    stack.push(frame);
    frames.push(frame);
  };
  const leave = (frame: Frame) => {
    frames.pop();
    const parent = frames.at(-1);
    if (parent !== undefined) {
      parent.low = Math.min(parent.low, frame.low);
    }
    if (frame.low !== frame.order) {
      return;
    }
    const members = stack.splice(stack.lastIndexOf(frame));
    const component = new Set(members.map((member) => member.id));
    const inComponent = (child: NodeId) => component.has(child);
    members.forEach((member) => {
      open.delete(member.id);
      walked.add(member.id);
    });
    const recurs = members.length > 1 || frame.applied.includes(frame.id);
    const branching = recurs
      ? branchingNodes(graph, new Map(members.map(({ id, held, beside }) => [id, { held, beside }])))
      : new Set();
    if (branching.size > 0 || members.some(({ applied }) => applied.some((child) => leadOf(child) !== undefined))) {
      members.forEach(({ id, held }) => {
        const copied = held.every(
          ([[keyword], child]) =>
            (leadOf(child) === undefined && !inComponent(child)) ||
            PART_KEYWORDS.has(keyword) ||
            CONJUNCT_KEYWORDS.has(keyword) ||
            DEFINITIONS_KEYWORDS.has(keyword),
        );
        leads.set(id, copied && !branching.has(id) ? 'copied' : 'cut');
        if (recurs) {
          cycles.set(id, frame.id);
        }
      });
      // A part a cut conjunct declares no longer counts as evaluated for the `unevaluatedProperties` or
      // `unevaluatedItems` beside it, which would then reject what the node accepts, so such a node is cut as a whole.
      // Which members narrow depends on which others do, so it is read until nothing changes; each pass only adds
      for (let changed = true; changed;) {
        changed = false;
        for (const { id, conjuncts, evaluated } of members) {
          if (leads.get(id) === 'copied' && evaluated.some(narrows)) {
            leads.set(id, 'cut');
            changed = true;
          }
          if (!narrowing.has(id) && (leads.get(id) === 'cut' || conjuncts.some(narrows))) {
            narrowing.add(id);
            changed = true;
          }
        }
      }
    }
    members
      .filter(({ held }) => held.some(([[keyword], child]) => PART_KEYWORDS.has(keyword) && leadOf(child)))
      .forEach((member) => holders.add(member.id));
  };
  enter(root);
  for (let frame = frames.at(-1); frame !== undefined; frame = frames.at(-1)) {
    const child = frame.next.pop();
    const order = child === undefined ? undefined : open.get(child);
    if (order !== undefined) {
      frame.low = Math.min(frame.low, order);
    } else if (child === undefined) {
      leave(frame);
    } else if (!walked.has(child)) {
      enter(child);
    }
  }
}

/** Returns, for each node of the root `graph` that holds a subschema `reachedFrom()` reaches, or holds one that does
 * however deep, the subschemas it holds that do, see `childrenOf()`; a node that leads to none is left out
 */
function childrenLeadingToTargets<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
): ReadonlyMap<NodeId, readonly [string[], NodeId][]> {
  const children = new Map<NodeId, readonly [string[], NodeId][]>();
  const parents = new Map<NodeId, NodeId[]>();
  const leading: NodeId[] = [];
  for (let id = 0; id < graph.size; id += 1) {
    const held = childrenOf(graph, id);
    children.set(id, held);
    for (const [, child] of held) {
      const known = parents.get(child);
      if (known === undefined) {
        parents.set(child, [id]);
      } else {
        known.push(id);
      }
    }
    if (held.some(([tokens]) => REACHING_KEYWORDS.has(tokens[0]))) {
      leading.push(id);
    }
  }
  const found = new Set(leading);
  // An array iterator reads the parents pushed while it runs
  for (const id of leading) {
    for (const parent of parents.get(id) ?? []) {
      if (!found.has(parent)) {
        found.add(parent);
        leading.push(parent);
      }
    }
  }
  return new Map(
    [...children]
      .filter(([id]) => found.has(id))
      .map(([id, held]) => [id, held.filter(([, child]) => found.has(child))]),
  );
}

/** Calls `visit` with each node of the root `graph` at every place the root holds it, below the root and below the
 * place each `$ref` names, which may be under a keyword no walk of the schema follows: the places an equal copy of the
 * root sharing no objects has. A place holding nothing that leads to a subschema `reachedFrom()` reaches is not walked
 * into, and neither is one whose node recurs on its own path, which only a root holding itself through its own objects
 * has.
 */
function forEachPlace<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  visit: (id: NodeId, place: string) => void,
): void {
  const leading = childrenLeadingToTargets(graph);
  const seen = new Set<string>();
  const above = new Set<NodeId>();
  const walk = (id: NodeId, place: string) => {
    const children = leading.get(id);
    if (children === undefined || above.has(id) || seen.has(place)) {
      return;
    }
    seen.add(place);
    visit(id, place);
    above.add(id);
    for (const [tokens, child] of children) {
      walk(child, childPointer(place, tokens));
    }
    above.delete(id);
  };
  walk(graph.root, '');
  for (let id = 0; id < graph.size; id += 1) {
    const node = graph.node(id);
    const place = node.kind === 'schema' ? refPlace(node) : undefined;
    if (node.kind === 'schema' && node.ref !== undefined && place !== undefined) {
      walk(node.ref, place);
    }
  }
}

/** Returns every schema the form hands a validator for the root of `graph`: the root itself; each `if`; each
 * `anyOf`/`oneOf` option, as a pointer and as scored, plain and relaxed, which for a boolean option is the schema it
 * reads as, `{}` or `{ not: {} }`, and `{}` where an option is a boolean; the property each option declares under any
 * `discriminator.propertyName` in the root; and the condition each `oneOf` option of a `dependencies` schema is matched
 * on. Each is listed at every place the root holds it, see `forEachPlace()`, and named by that place, so the list
 * depends on the root's content alone, never on form data nor on which objects the root shares: one object the root
 * holds in two places is listed at each, as two equal copies of it would be, and the form names it at either.
 *
 * @param graph - The graph of the root
 * @returns - The schemas, the root first
 */
export function validationTargets<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>): S[] {
  // The field reads its discriminator from the schema it retrieves, which takes one declared beside a `$ref` to the
  // options or in another `allOf` entry, so each option is listed under every name a discriminator anywhere declares
  const discriminators = new Set<string>();
  for (let id = 0; id < graph.size; id += 1) {
    const node = graph.node(id);
    const name = node.kind === 'schema' ? getByPath(node.raw, DISCRIMINATOR_PATH) : undefined;
    if (typeof name === 'string') {
      discriminators.add(name);
    }
  }
  const targets: S[] = [graph.rawRoot];
  forEachPlace(graph, (id, place) => {
    for (const reached of reachedFrom(graph, id, place)) {
      targets.push(...reachedTargets(graph, reached, discriminators));
    }
  });
  return targets;
}

/** Returns the schemas `validationTargets()` lists for one subschema a form validates against, at its place */
function reachedTargets<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  reached: Reached,
  discriminators: ReadonlySet<string>,
): S[] {
  const { id, place, key } = reached;
  if (reached.role === IF_KEY) {
    return [targetAt(graph, id, place)];
  }
  if (key !== undefined) {
    const condition = dependencyConditionAt(graph, id, place, key);
    return condition === undefined ? [] : [condition];
  }
  const targets = [
    targetAt(graph, id, place),
    scoringTargetAt(graph, id, place, false),
    scoringTargetAt(graph, id, place, true),
  ];
  if (graph.node(id).kind === 'boolean') {
    // `SchemaField` retrieves a boolean option as a schema of its own, `{}`, which has no place in the root
    targets.push(schemaFrom(graph.rawRoot, {}));
  }
  for (const name of discriminators) {
    const discriminator = declaredPropertyTargetAt(graph, id, place, name);
    if (discriminator !== undefined) {
      targets.push(discriminator);
    }
  }
  return targets;
}
