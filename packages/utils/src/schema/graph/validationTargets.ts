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
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '../../types.ts';
import KeyedMemo from './keyedMemo.ts';
import { booleanSchema, schemaFrom } from './mergePlan.ts';
import { isRootPointer } from './parseSchemaGraph.ts';
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
 * `encodeURI()` keeps it, and Ajv drops one ending the `$ref` as an empty fragment.
 */
function refTo(pointer: string): string {
  return `#${encodeURI(pointer).replaceAll('#', '%23')}`;
}

/** The `{ $ref }` `pointerTo()` names each node by, per graph and node, or `null` for a node it gives none, so a
 * validator caching what it compiles by schema is handed the same object for a node every time
 */
const pointers = new KeyedMemo<object | null>();

/** Returns `{ $ref }` naming the node `id` where it sits in the root, which a validator resolves against the root it is
 * given, or undefined for a node with no location there or a boolean one, which holds no `$ref` for a pointer to keep
 * in reach and which ata reads as `true` behind a `$ref`
 *
 * @param graph - The graph of the root
 * @param id - The node to name
 * @returns - The `$ref` wrapper
 */
export function pointerTo<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>, id: NodeId): S | undefined {
  const keys = [graph, id];
  const memoized = pointers.peek(keys);
  if (memoized === null) {
    return undefined;
  }
  if (isSchemaObject<S>(memoized)) {
    return memoized;
  }
  const node = graph.node(id);
  const pointer =
    node.kind === 'schema' && isRootPointer(node.pointer)
      ? schemaFrom(graph.rawRoot, { [REF_KEY]: refTo(node.pointer) })
      : undefined;
  pointers.set(keys, pointer ?? null);
  return pointer;
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

/** Returns the nodes whose keywords apply wherever the node `id` applies: the node, what its `$ref` resolves to and its
 * `allOf` entries, and, unless `unconditional`, its `then`/`else` and its `dependencies` schemas, which apply only for
 * some data. Each is followed the same way and listed once.
 */
function scopeOf<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  unconditional = false,
): ObjectNode<S>[] {
  const seen = new Set<NodeId>();
  const nodes: ObjectNode<S>[] = [];
  const visit = (next: NodeId | undefined) => {
    if (next === undefined || seen.has(next)) {
      return;
    }
    seen.add(next);
    const node = graph.node(next);
    if (node.kind !== 'schema') {
      return;
    }
    nodes.push(node);
    visit(node.ref);
    graph.subschemas(next, ALL_OF_KEY).forEach(([, member]) => visit(member));
    if (unconditional) {
      return;
    }
    visit(graph.child(next, THEN_KEY));
    visit(graph.child(next, ELSE_KEY));
    graph.subschemas(next, DEPENDENCIES_KEY).forEach(([, dependency]) => visit(dependency));
  };
  visit(id);
  return nodes;
}

/** Returns the nodes of the property `key` the option `id` declares: every declaration that applies whatever the data,
 * as the OpenAPI spelling `allOf: [{ $ref: Base }, { properties: { petType: { const: 'cat' } } }]` declares it twice,
 * and the value has to fit each of them. Where only a `then`, an `else` or a `dependencies` schema declares it, the
 * first of those is read alone: a `then` and its `else` apply to different data, and no value need fit both.
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
  return declarations.get([graph, id, key], () => {
    const declaredIn = (nodes: ObjectNode<S>[]) =>
      nodes.flatMap((node) => {
        const property = graph.child(node.id, PROPERTIES_KEY, key);
        return property === undefined ? [] : [property];
      });
    const always = declaredIn(scopeOf(graph, id, true));
    return always.length > 0 ? always : declaredIn(scopeOf(graph, id)).slice(0, 1);
  });
}

/** The nodes `declaredProperties()` finds, per graph, option and key: an option is matched on its discriminator on
 * every edit, and walking its scope each time repeats the same answer
 */
const declarations = new KeyedMemo<readonly NodeId[]>();

/** Returns what a validator checks the value of the property `key` the option `id` declares with: what `targetOf()`
 * hands it for the one declaration `declaredProperties()` finds, or an `allOf` of them for several
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
  const target = declaredPropertyTargets.get([graph, id, key], () => {
    const targets = declaredProperties(graph, id, key).map((property) => targetOf(graph, property));
    if (targets.length < 2) {
      return targets[0] ?? null;
    }
    return schemaFrom(graph.rawRoot, { [ALL_OF_KEY]: targets });
  });
  return isSchemaObject<S>(target) ? target : undefined;
}

/** The schemas `declaredPropertyTarget()` returns, per graph, option and key, or `null` where nothing declares the
 * property, so a validator caching what it compiles by schema is handed the same object every time
 */
const declaredPropertyTargets = new KeyedMemo<object | null>();

/** Returns the schema a dependency's `oneOf` option is matched on: an object whose `key` holds what the option says
 * the property holds
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
    const property = declaredPropertyTarget(graph, option, key);
    return property === undefined
      ? null
      : schemaFrom(graph.rawRoot, { type: 'object', properties: { [key]: property } });
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

function loosens(node: ObjectNode, loosening: Loosening): boolean {
  const { raw } = node;
  return (
    (loosening.required &&
      (REQUIRED_KEY in raw ||
        Object.values(isObject(raw[DEPENDENCIES_KEY]) ? raw[DEPENDENCIES_KEY] : {}).some(Array.isArray))) ||
    (loosening.additionalProperties && raw[ADDITIONAL_PROPERTIES_KEY] === false)
  );
}

/** Returns `value` with each subschema the graph holds in it replaced by what `targetOf()` hands a validator for it */
function pointed<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => pointed(graph, item));
  }
  if (!isObject(value)) {
    return value;
  }
  const id = graph.byObject(value);
  return id === undefined
    ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, pointed(graph, child)]))
    : targetOf(graph, id);
}

/** Returns a copy of the node `id` without what `loosening` drops, from the node and from the nodes `scopeOf()` lists,
 * a dropped `additionalProperties: false` turned into `true`. A `$ref` among them is read as JSON Schema reads one, as an
 * `allOf` entry beside the keywords next to it, since a pointer cannot subtract from what it names. The subschemas
 * under the copy's other keywords are named by `pointed()` where they sit in the root, so each `$ref` below them
 * resolves against the `$id`s above it there, and the copy drops its `$id`, which would rebase them.
 */
function derive<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  node: ObjectNode<S>,
  loosening: Loosening,
  path: ReadonlySet<NodeId>,
): S {
  const { id } = node;
  const inner = new Set(path).add(id);
  const sub = (value: unknown) => {
    const child = isObject(value) ? graph.byObject(value) : undefined;
    const childNode = child === undefined ? undefined : graph.node(child);
    if (childNode?.kind !== 'schema') {
      return value;
    }
    return inner.has(childNode.id) ? targetOf(graph, childNode.id) : derive(graph, childNode, loosening, inner);
  };
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
    Object.entries(rest).map(([key, value]) => [key, pointed(graph, value)]),
  );
  if (!loosening.required && required !== undefined) {
    copy[REQUIRED_KEY] = required;
  }
  const target = node.ref === undefined ? undefined : graph.node(node.ref);
  const resolved = target?.kind === 'invalid' ? undefined : target;
  const conjuncts = [
    ...(Array.isArray(allOf) ? allOf.map(sub) : []),
    ...(resolved === undefined ? [] : [resolved.kind === 'schema' ? sub(resolved.raw) : targetOf(graph, resolved.id)]),
  ];
  if (ref !== undefined && resolved === undefined) {
    copy[REF_KEY] = ref;
  }
  if (conjuncts.length > 0) {
    copy[ALL_OF_KEY] = conjuncts;
  }
  if (then !== undefined) {
    copy[THEN_KEY] = sub(then);
  }
  if (otherwise !== undefined) {
    copy[ELSE_KEY] = sub(otherwise);
  }
  const keptDependencies = Object.entries(isObject(dependencies) ? dependencies : {}).filter(
    ([, dependency]) => !loosening.required || !Array.isArray(dependency),
  );
  if (keptDependencies.length > 0) {
    copy[DEPENDENCIES_KEY] = Object.fromEntries(keptDependencies.map(([key, dependency]) => [key, sub(dependency)]));
  }
  if (loosening.additionalProperties && copy[ADDITIONAL_PROPERTIES_KEY] === false) {
    copy[ADDITIONAL_PROPERTIES_KEY] = true;
  }
  return schemaFrom(graph.rawRoot, copy);
}

/** Returns what an `anyOf`/`oneOf` option is scored with: `{ $ref }` naming it in the root, or, where something in its
 * scope states a `required`, lists names under `dependencies` or, with `relax`, sets `additionalProperties: false`,
 * the copy `derive()` makes without them. A user who has yet to fill in a key the option requires is still matched to
 * it. The `required`s are kept where nothing in the scope declares `properties`: an option such as
 * `{ required: ['email'] }` describes nothing else for the data to fit, and is chosen by the keys it requires. The
 * copy depends on the root, the node and `relax` alone, so a precompiled validator finds it under the key it was
 * compiled under.
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
  const target = buildScoringTarget(graph, id, relax);
  scoringTargets.set(keys, target);
  return target;
}

/** The schemas `scoringTarget()` returns, per graph, node and `relax`: an option is matched on every edit, and a
 * validator hashes a schema it is handed to find what it compiled for it
 */
const scoringTargets = new KeyedMemo<object>();

function buildScoringTarget<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId, relax: boolean): S {
  const node = graph.node(id);
  if (node.kind !== 'schema') {
    return targetOf(graph, id);
  }
  const pointer = pointerTo(graph, id);
  const scope = scopeOf(graph, id);
  const loosening = { required: scope.some((member) => isObject(member.raw.properties)), additionalProperties: relax };
  return pointer !== undefined && !scope.some((member) => loosens(member, loosening))
    ? pointer
    : derive(graph, node, loosening, new Set());
}

/** What of an option's scope `holdsDeclaredKey()` reads: the names and patterns its `properties` and
 * `patternProperties` declare, or the answer, where it does not depend on the data
 */
type DeclaredKeys = boolean | { readonly names: ReadonlySet<string>; readonly patterns: readonly RegExp[] };

/** The `DeclaredKeys` of each option, per graph and node */
const declaredKeysMemo = new KeyedMemo<DeclaredKeys>();

function declaredKeys<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): DeclaredKeys {
  return declaredKeysMemo.get([graph, id], () => readDeclaredKeys(graph, id));
}

function readDeclaredKeys<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): DeclaredKeys {
  const scope = scopeOf(graph, id).flatMap((node) =>
    isObject(node.raw.properties) ? [{ node, declared: Object.keys(node.raw.properties) }] : [],
  );
  if (scope.length === 0) {
    return true;
  }
  const names = new Set(scope.flatMap(({ declared }) => declared));
  if (names.size === 0) {
    return scope.some(({ node }) => allowsAdditionalProperties(node.raw));
  }
  const patterns = scope
    .flatMap(({ node }) => graph.subschemas(node.id, PATTERN_PROPERTIES_KEY))
    .map(([pattern]) => patternRegExp(pattern));
  return { names, patterns };
}

/** Returns whether the object `data` holds a key the option `id` declares, which scoring asks on top of the option's
 * schema: an object validates against an object option whatever keys it holds, as long as none conflicts, so without
 * it a "none of these" option would take every object. A key counts when a `properties` or `patternProperties` in the
 * option's scope names it. An option declaring no `properties` is not asked; one whose `properties` name nothing
 * matches only where it takes extra keys, and then whatever the data holds.
 *
 * @param graph - The graph of the root
 * @param id - The option's node
 * @param data - The data being matched
 * @returns - Whether the option can match the data
 */
export function holdsDeclaredKey<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  data: unknown,
): boolean {
  const declared = declaredKeys(graph, id);
  if (typeof declared === 'boolean') {
    return declared;
  }
  const { names, patterns } = declared;
  return (
    !isObject(data) || Object.keys(data).some((key) => names.has(key) || patterns.some((pattern) => pattern.test(key)))
  );
}

/** Returns every schema the form hands a validator for the root of `graph`: the root itself; each `if`; each
 * `anyOf`/`oneOf` option, as a pointer and as scored, plain and relaxed, and `{}` where an option is a boolean; the
 * property each option declares under any `discriminator.propertyName` in the root; and the condition each `oneOf`
 * option of a `dependencies` schema is matched on. Each is named by the graph, so the list depends on the root alone,
 * never on form data.
 *
 * @param graph - The graph of the root
 * @returns - The schemas, the root first
 */
export function validationTargets<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>): S[] {
  const nodes: ObjectNode<S>[] = [];
  for (let id = 0; id < graph.size; id += 1) {
    const node = graph.node(id);
    if (node.kind === 'schema' && isRootPointer(node.pointer)) {
      nodes.push(node);
    }
  }
  // The field reads its discriminator from the schema it retrieves, which takes one declared beside a `$ref` to the
  // options or in another `allOf` entry, so each option is listed under every name a discriminator anywhere declares
  const discriminators = new Set(
    nodes.flatMap((node) => {
      const name = getByPath(node.raw, DISCRIMINATOR_PATH);
      return typeof name === 'string' ? [name] : [];
    }),
  );
  return [graph.rawRoot, ...nodes.flatMap((node) => nodeTargets(graph, node, discriminators))];
}

/** Returns the schemas `validationTargets()` lists for the conditions, options and dependencies of one node */
function nodeTargets<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  node: ObjectNode<S>,
  discriminators: ReadonlySet<string>,
): S[] {
  const targets: S[] = [];
  const condition = graph.child(node.id, IF_KEY);
  if (condition !== undefined) {
    targets.push(targetOf(graph, condition));
  }
  const options = [...graph.subschemas(node.id, ANY_OF_KEY), ...graph.subschemas(node.id, ONE_OF_KEY)];
  for (const [, option] of options) {
    targets.push(targetOf(graph, option), scoringTarget(graph, option, false), scoringTarget(graph, option, true));
    if (graph.node(option).kind === 'boolean') {
      // `SchemaField` retrieves a boolean option as a schema of its own, `{}`, which has no place in the root
      targets.push(schemaFrom(graph.rawRoot, {}));
    }
    for (const name of discriminators) {
      const discriminator = declaredPropertyTarget(graph, option, name);
      if (discriminator !== undefined) {
        targets.push(discriminator);
      }
    }
  }
  graph.subschemas(node.id, DEPENDENCIES_KEY).forEach(([key, dependency]) => {
    for (const provider of scopeOf(graph, dependency)) {
      for (const [, option] of graph.subschemas(provider.id, ONE_OF_KEY)) {
        const dependent = dependencyCondition(graph, option, key);
        if (dependent !== undefined) {
          targets.push(dependent);
        }
      }
    }
  });
  return targets;
}
