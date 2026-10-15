import { allowsAdditionalProperties, patternRegExp } from '../../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
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
import isObject from '../../isObject.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '../../types.ts';
import { booleanSchema, schemaFrom } from './mergePlan.ts';
import { stringKeyword } from './parseSchemaGraph.ts';
import type { NodeId, ObjectNode, SchemaGraph } from './parseSchemaGraph.ts';

/** A pointer token starting with a `~` that JSON pointer escaping cannot produce, which is how the graph places the
 * nodes that have no location in the root: those parsed from a schema a caller built, and the `allOf` it reads a
 * chained `$ref` as
 */
const NOT_IN_ROOT = /(^|\/)~[^01]/;

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

/** Returns the `$ref` naming the subschema at the JSON `pointer` in the root, each token percent-encoded as a URI
 * fragment requires
 */
function refTo(pointer: string): string {
  return `#${pointer.split('/').map(encodeURIComponent).join('/')}`;
}

/** Returns `{ $ref }` naming the node `id` where it sits in the root, which a validator resolves against the root it is
 * given, or undefined for a node with no location there
 *
 * @param graph - The graph of the root
 * @param id - The node to name
 * @returns - The `$ref` wrapper
 */
export function pointerTo<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>, id: NodeId): S | undefined {
  const node = graph.node(id);
  if (node.kind === 'invalid' || NOT_IN_ROOT.test(node.pointer)) {
    return undefined;
  }
  return schemaFrom(graph.rawRoot, { [REF_KEY]: refTo(node.pointer) });
}

/** Returns what a validator checks the subschema `id` with: `{ $ref }` naming it in the root, or the subschema itself
 * when it has no location there
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

/** Returns the nodes whose keywords apply wherever the node `id` applies, whatever the data: the node, what its `$ref`
 * resolves to, its `allOf` entries, its `then`/`else` and its `dependencies` schemas, each followed the same way and
 * each listed once
 */
function scopeOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, id: NodeId): ObjectNode<S>[] {
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
    visit(graph.child(next, THEN_KEY));
    visit(graph.child(next, ELSE_KEY));
    graph.subschemas(next, DEPENDENCIES_KEY).forEach(([, dependency]) => visit(dependency));
  };
  visit(id);
  return nodes;
}

/** Returns the node of the property `key` the option `id` declares, the first one met in the order `scopeOf()` lists
 * the nodes in
 *
 * @param graph - The graph of the root
 * @param id - The option, or any subschema declaring properties
 * @param key - The property name
 * @returns - The property's node, or undefined when nothing in the scope declares it
 */
export function declaredProperty<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  key: string,
): NodeId | undefined {
  for (const node of scopeOf(graph, id)) {
    const property = graph.child(node.id, PROPERTIES_KEY, key);
    if (property !== undefined) {
      return property;
    }
  }
  return undefined;
}

/** Returns the schema a dependency's `oneOf` option is matched on: an object whose `key` holds what the option says
 * the property holds
 *
 * @param graph - The graph of the root
 * @param key - The name of the dependency
 * @param property - The node of the option's property `key`
 * @returns - The condition to hand the validator
 */
export function dependencyCondition<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  key: string,
  property: NodeId,
): S {
  return schemaFrom(graph.rawRoot, { type: 'object', properties: { [key]: targetOf(graph, property) } });
}

function relaxes(node: ObjectNode, relax: boolean): boolean {
  const { raw } = node;
  return (
    REQUIRED_KEY in raw ||
    Object.values(isObject(raw[DEPENDENCIES_KEY]) ? raw[DEPENDENCIES_KEY] : {}).some(Array.isArray) ||
    (relax && raw[ADDITIONAL_PROPERTIES_KEY] === false)
  );
}

/** Returns a copy of the node `id` that asks only that the data fit what it describes: every `required`, and every
 * `dependencies` entry listing names, is dropped from the node and the nodes `scopeOf()` lists, and with `relax`, an
 * `additionalProperties: false` among them is turned into `true`. A `$ref` among them is read as JSON Schema reads
 * one, as an `allOf` entry beside the keywords next to it, since a pointer cannot subtract from what it names. The
 * subschemas under the copy's other keywords stay as they are.
 */
function derive<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  node: ObjectNode<S>,
  relax: boolean,
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
    return inner.has(childNode.id) ? targetOf(graph, childNode.id) : derive(graph, childNode, relax, inner);
  };
  const {
    [REQUIRED_KEY]: _required,
    [REF_KEY]: ref,
    [ALL_OF_KEY]: allOf,
    [THEN_KEY]: then,
    [ELSE_KEY]: otherwise,
    [DEPENDENCIES_KEY]: dependencies,
    ...rest
  }: GenericObjectType = node.raw;
  const copy: GenericObjectType = rest;
  const target = node.ref === undefined ? undefined : graph.node(node.ref);
  const conjuncts = [
    ...(Array.isArray(allOf) ? allOf.map(sub) : []),
    ...(target?.kind === 'schema' ? [sub(target.raw)] : []),
  ];
  if (ref !== undefined && target?.kind !== 'schema') {
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
  const schemaDependencies = Object.entries(isObject(dependencies) ? dependencies : {}).filter(
    ([, dependency]) => !Array.isArray(dependency),
  );
  if (schemaDependencies.length > 0) {
    copy[DEPENDENCIES_KEY] = Object.fromEntries(schemaDependencies.map(([key, dependency]) => [key, sub(dependency)]));
  }
  if (relax && copy[ADDITIONAL_PROPERTIES_KEY] === false) {
    copy[ADDITIONAL_PROPERTIES_KEY] = true;
  }
  return withVariantId(schemaFrom(graph.rawRoot, copy));
}

/** Returns what an `anyOf`/`oneOf` option is scored with: `{ $ref }` naming it in the root, or, where something in its
 * scope states a `required`, lists names under `dependencies` or, with `relax`, sets `additionalProperties: false`,
 * the copy `derive()` makes without them. A user who has yet to fill in a key the option requires is still matched to
 * it. The copy depends on the root, the node and `relax` alone, so a precompiled validator finds it under the key it
 * was compiled under.
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
  const node = graph.node(id);
  if (node.kind !== 'schema') {
    return targetOf(graph, id);
  }
  const pointer = pointerTo(graph, id);
  return pointer !== undefined && !scopeOf(graph, id).some((member) => relaxes(member, relax))
    ? pointer
    : derive(graph, node, relax, new Set());
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
  if (!isObject(data)) {
    return true;
  }
  const patterns = scope
    .flatMap(({ node }) => graph.subschemas(node.id, PATTERN_PROPERTIES_KEY))
    .map(([pattern]) => patternRegExp(pattern));
  return Object.keys(data).some((key) => names.has(key) || patterns.some((pattern) => pattern.test(key)));
}

/** Returns every schema the form hands a validator for the root of `graph`: the root itself; each `if`; each
 * `anyOf`/`oneOf` option, as a pointer and as scored, plain and relaxed; the property each option names as its
 * discriminator; and the condition each `oneOf` option of a `dependencies` schema is matched on. Each is named by the
 * graph, so the list depends on the root alone, never on form data.
 *
 * @param graph - The graph of the root
 * @returns - The schemas, the root first
 */
export function validationTargets<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>): S[] {
  const targets: S[] = [graph.rawRoot];
  for (let id = 0; id < graph.size; id += 1) {
    const node = graph.node(id);
    if (node.kind === 'schema' && !NOT_IN_ROOT.test(node.pointer)) {
      targets.push(...nodeTargets(graph, node));
    }
  }
  return targets;
}

/** Returns the schemas `validationTargets()` lists for the conditions, options and dependencies of one node */
function nodeTargets<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, node: ObjectNode<S>): S[] {
  const targets: S[] = [];
  const condition = graph.child(node.id, IF_KEY);
  if (condition !== undefined) {
    targets.push(targetOf(graph, condition));
  }
  const options = [...graph.subschemas(node.id, ANY_OF_KEY), ...graph.subschemas(node.id, ONE_OF_KEY)];
  for (const [, option] of options) {
    targets.push(targetOf(graph, option), scoringTarget(graph, option, false), scoringTarget(graph, option, true));
    const discriminatorName = stringKeyword(Reflect.get(node.raw, 'discriminator'), 'propertyName');
    const discriminator =
      discriminatorName === undefined ? undefined : declaredProperty(graph, option, discriminatorName);
    if (discriminator !== undefined) {
      targets.push(targetOf(graph, discriminator));
    }
  }
  graph.subschemas(node.id, DEPENDENCIES_KEY).forEach(([key, dependency]) => {
    for (const provider of scopeOf(graph, dependency)) {
      for (const [, option] of graph.subschemas(provider.id, ONE_OF_KEY)) {
        const property = declaredProperty(graph, option, key);
        if (property !== undefined) {
          targets.push(dependencyCondition(graph, key, property));
        }
      }
    }
  });
  return targets;
}
