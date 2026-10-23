import { allowsAdditionalProperties, patternRegExp } from '../../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  DISCRIMINATOR_PATH,
  ELSE_KEY,
  ID_KEY,
  IF_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  REQUIRED_KEY,
  THEN_KEY,
} from '../../constants.ts';
import hashForSchema from '../../hashForSchema.ts';
import isObject, { isSchemaObject } from '../../isObject.ts';
import { getByPath } from '../../pathUtils.ts';
import { keywordShape } from '../../schemaUri.ts';
import type { FormContextType, GenericObjectType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../../types.ts';
import KeyedMemo from './keyedMemo.ts';
import { booleanSchema, schemaFrom } from './mergePlan.ts';
import { childPointer, isRootPointer } from './parseSchemaGraph.ts';
import type { NodeId, ObjectNode, SchemaGraph } from './parseSchemaGraph.ts';

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

/** A subschema in an option's scope, and the place the walk of the scope reached it at */
interface Member<S extends StrictRJSFSchema> {
  readonly node: ObjectNode<S>;
  readonly place: Place;
}

/** Returns the nodes whose keywords apply wherever the node `id` applies: the node, what its `$ref` resolves to and its
 * `allOf` entries, and, unless `unconditional`, its `then`/`else` and its `dependencies` schemas, which apply only for
 * some data. Each is followed the same way, at the place it is reached at from `place`: below it, or where a `$ref`
 * names. A place is listed once, so one object the root holds in two places of the scope is listed at each, as two
 * equal copies of it would be; a node with no place is listed once. An object reached again below itself, which only
 * a root holding itself through its own objects does, is not followed.
 */
function scopeAt<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  place: Place,
  unconditional = false,
): Member<S>[] {
  const seen = new Set<string>();
  const members: Member<S>[] = [];
  const visit = (next: NodeId | undefined, at: Place, above: ReadonlySet<NodeId>) => {
    if (next === undefined || above.has(next) || seen.has(placeKey(next, at))) {
      return;
    }
    seen.add(placeKey(next, at));
    const node = graph.node(next);
    if (node.kind !== 'schema') {
      return;
    }
    members.push({ node, place: at });
    const inner = new Set(above).add(next);
    visit(node.ref, refPlace(node), new Set());
    graph
      .subschemas(next, ALL_OF_KEY)
      .forEach(([index, member]) => visit(member, placeBelow(at, [ALL_OF_KEY, index]), inner));
    if (unconditional) {
      return;
    }
    visit(graph.child(next, THEN_KEY), placeBelow(at, [THEN_KEY]), inner);
    visit(graph.child(next, ELSE_KEY), placeBelow(at, [ELSE_KEY]), inner);
    graph
      .subschemas(next, DEPENDENCIES_KEY)
      .forEach(([key, dependency]) => visit(dependency, placeBelow(at, [DEPENDENCIES_KEY, key]), inner));
  };
  visit(id, place, new Set());
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
  const always = declaredIn(scopeAt(graph, id, place, true));
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

function loosens(node: ObjectNode, loosening: Loosening): boolean {
  const { raw } = node;
  return (
    (loosening.required &&
      (REQUIRED_KEY in raw ||
        Object.values(isObject(raw[DEPENDENCIES_KEY]) ? raw[DEPENDENCIES_KEY] : {}).some(Array.isArray))) ||
    (loosening.additionalProperties && raw[ADDITIONAL_PROPERTIES_KEY] === false)
  );
}

/** Returns the value the keyword `key` holds in a subschema reached at `place`, whose `$ref`s resolve against `base`,
 * with each subschema it holds replaced by `{ $ref }` naming its place below `place`, or, for a subschema with no
 * place, by what `unplaced` hands a validator for its node, looked up under `base`, since an object reached in two
 * resources is a node in each
 */
function pointed<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  key: string,
  value: unknown,
  place: Place,
  base: string,
  unplaced: (sub: unknown, id: NodeId) => unknown,
): unknown {
  const name = (sub: unknown, tokens: string[]) => {
    const id = isObject(sub) ? graph.byObject(sub, base) : undefined;
    if (id === undefined) {
      return sub;
    }
    return place === undefined ? unplaced(sub, id) : refAt(childPointer(place, tokens));
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

/** Returns a copy of the node `id` reached at `place` without what `loosening` drops, from the node and from the nodes
 * `scopeOf()` lists, a dropped `additionalProperties: false` turned into `true`. A `$ref` among them is read as JSON
 * Schema reads one, as an `allOf` entry beside the keywords next to it, since a pointer cannot subtract from what it
 * names. The subschemas under the copy's other keywords are named by `pointed()` at their places below `place`, so each
 * `$ref` below them resolves against the `$id`s above it there, and the copy drops its `$id`, which would rebase them.
 * One with no place, such as a property of an option a merge of two lists rebuilt in a resource of its own, is named
 * where the root holds its node, or else copied as well, keeping all it states: the validator would resolve the `$ref`s
 * of the subschema as written against the root rather than against that resource. A subschema reached again at a place
 * on the way to it, `path`, or below itself, `above`, which only a root holding itself through its own objects does, is
 * named rather than copied without end.
 */
function derive<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  node: ObjectNode<S>,
  place: Place,
  loosening: Loosening,
  path: ReadonlySet<string>,
  above: ReadonlySet<NodeId>,
): S {
  const { id } = node;
  const innerPath = new Set(path).add(placeKey(id, place));
  const innerAbove = new Set(above).add(id);
  const sub = (value: unknown, child: NodeId | undefined, at: Place, viaRef = false, as = loosening) => {
    const childNode = child === undefined ? undefined : graph.node(child);
    if (childNode?.kind !== 'schema') {
      return value;
    }
    return innerPath.has(placeKey(childNode.id, at)) || (!viaRef && innerAbove.has(childNode.id))
      ? targetAt(graph, childNode.id, at)
      : derive(graph, childNode, at, as, innerPath, viaRef ? new Set() : innerAbove);
  };
  const unplaced = (value: unknown, child: NodeId) =>
    pointerTo(graph, child) ?? sub(value, child, undefined, false, KEPT);
  const {
    [ID_KEY]: _id,
    [REQUIRED_KEY]: required,
    [REF_KEY]: ref,
    [ALL_OF_KEY]: allOf,
    [THEN_KEY]: then,
    [ELSE_KEY]: otherwise,
    [DEPENDENCIES_KEY]: dependencies,
    ...rest
  }: GenericObjectType = node.raw;
  const copy: GenericObjectType = Object.fromEntries(
    Object.entries(rest).map(([key, value]) => [key, pointed(graph, key, value, place, node.baseUri, unplaced)]),
  );
  if (!loosening.required && required !== undefined) {
    copy[REQUIRED_KEY] = required;
  }
  const target = node.ref === undefined ? undefined : graph.node(node.ref);
  const resolved = target?.kind === 'invalid' ? undefined : target;
  const conjuncts = [
    ...(Array.isArray(allOf)
      ? allOf.map((entry, index) =>
          sub(entry, graph.child(id, ALL_OF_KEY, String(index)), placeBelow(place, [ALL_OF_KEY, String(index)])),
        )
      : []),
    ...(resolved === undefined
      ? []
      : [
          resolved.kind === 'schema'
            ? sub(resolved.raw, resolved.id, refPlace(node), true)
            : targetOf(graph, resolved.id),
        ]),
  ];
  if (ref !== undefined && resolved === undefined) {
    copy[REF_KEY] = ref;
  }
  if (conjuncts.length > 0) {
    copy[ALL_OF_KEY] = conjuncts;
  }
  if (then !== undefined) {
    copy[THEN_KEY] = sub(then, graph.child(id, THEN_KEY), placeBelow(place, [THEN_KEY]));
  }
  if (otherwise !== undefined) {
    copy[ELSE_KEY] = sub(otherwise, graph.child(id, ELSE_KEY), placeBelow(place, [ELSE_KEY]));
  }
  const keptDependencies = Object.entries(isObject(dependencies) ? dependencies : {}).filter(
    ([, dependency]) => !loosening.required || !Array.isArray(dependency),
  );
  if (keptDependencies.length > 0) {
    copy[DEPENDENCIES_KEY] = Object.fromEntries(
      keptDependencies.map(([key, dependency]) => [
        key,
        sub(dependency, graph.child(id, DEPENDENCIES_KEY, key), placeBelow(place, [DEPENDENCIES_KEY, key])),
      ]),
    );
  }
  if (loosening.additionalProperties && copy[ADDITIONAL_PROPERTIES_KEY] === false) {
    copy[ADDITIONAL_PROPERTIES_KEY] = true;
  }
  return schemaFrom(graph.rawRoot, copy);
}

/** Returns what the `anyOf`/`oneOf` option `id` reached at `place` is scored with: `{ $ref }` naming the place, or,
 * where something in its scope states a `required`, lists names under `dependencies` or, with `relax`, sets
 * `additionalProperties: false`, the copy `derive()` makes without them. A user who has yet to fill in a key the
 * option requires is still matched to it. The `required`s are kept where nothing in the scope declares `properties`: an
 * option such as `{ required: ['email'] }` describes nothing else for the data to fit, and is chosen by the keys it
 * requires.
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
  const scope = scopeOf(graph, id);
  const loosening = { required: scope.some((member) => isObject(member.raw.properties)), additionalProperties: relax };
  return place !== undefined && !scope.some((member) => loosens(member, loosening))
    ? targetAt(graph, id, place)
    : derive(graph, node, place, loosening, new Set(), new Set());
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
  return declaredKeysMemo.get([graph, id, context.additionalPropertiesWhenAbsent === 'allow'], () =>
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

/** Returns the subschemas the node `id` holds, each with the unescaped pointer tokens leading to it */
function childrenOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): [string[], NodeId][] {
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

/** Returns, for each node of the root `graph` that holds a subschema `reachedFrom()` reaches, or holds one that does
 * however deep, the subschemas it holds that do, see `childrenOf()`; a node that leads to none is left out
 */
function childrenLeadingToTargets<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
): ReadonlyMap<NodeId, [string[], NodeId][]> {
  const children = new Map<NodeId, [string[], NodeId][]>();
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
