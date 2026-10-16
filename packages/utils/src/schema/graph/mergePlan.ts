import { patternRegExp } from '../../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  RJSF_REF_KEY,
  THEN_KEY,
} from '../../constants.ts';
import isObject, { isSchemaObject } from '../../isObject.ts';
import logOnce from '../../logOnce.ts';
import mergeSchemas from '../../mergeSchemas.ts';
import { getByPath } from '../../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../../types.ts';
import shallowAllOfMerge from '../shallowAllOfMerge.ts';
import KeyedMemo from './keyedMemo.ts';
import { stringKeyword } from './parseSchemaGraph.ts';
import type { NodeId, ObjectNode, SchemaGraph, SchemaNode } from './parseSchemaGraph.ts';

/** The `$ref` targets entered on the way to a plan entry, from the nearest point the recursion rule restarts it at */
export type RefPath = readonly NodeId[];

/** A containment node a field is reached through, with the ref path of the plan entry that declares it */
export interface Seed {
  readonly node: NodeId;
  readonly refPath: RefPath;
}

/** How a plan entry joined the plan */
export type PlanEdge = 'seed' | 'ref' | 'allOf' | 'then' | 'else' | 'dependency' | 'option';

/** One node merged at a field. A `ref` entry's `refPath` ends with the entry's own node. */
export interface PlanEntry {
  readonly node: NodeId;
  readonly edge: PlanEdge;
  readonly refPath: RefPath;
}

/** The node providing a keyword of a schema reached through `$ref`s, and the ref path at that node */
export interface Provider<S extends StrictRJSFSchema = RJSFSchema> {
  readonly node: ObjectNode<S>;
  readonly refPath: RefPath;
  /** A property of the node's `properties` the plan leaves out: the one a dependency's `oneOf` option is chosen by */
  readonly drops?: string;
}

/** The keywords one chain of `$ref`s supplies to a plan, each with the node providing it: the target's keywords,
 * overridden by those beside the `$ref`
 */
export type Keywords<S extends StrictRJSFSchema = RJSFSchema> = ReadonlyMap<string | symbol, Provider<S>>;

/** An `anyOf`/`oneOf` a plan met, and the option `PlanPolicy.selectOption` chose from it, if it chose one */
export interface OptionChoice {
  readonly keyword: 'anyOf' | 'oneOf';
  /** The node holding the options */
  readonly provider: NodeId;
  /** The ref path the node holding the options was entered with */
  readonly refPath: RefPath;
  readonly options: readonly NodeId[];
  /** The list of options as the node holding it declares it */
  readonly list: unknown;
  /** Whether the schema offering the options has `dependencies`, the one case `retrieveSchema()` merges an option */
  readonly dependencies: boolean;
  readonly selected?: number;
}

/** What `PlanPolicy.selectOption` is asked to choose an option from */
export interface OptionRequest<S extends StrictRJSFSchema = RJSFSchema> extends Omit<OptionChoice, 'selected'> {
  readonly graph: SchemaGraph<S>;
  readonly data: unknown;
  /** The data the plan's `dependencies` qualify against */
  readonly depData: unknown;
  /** The `discriminator.propertyName` of the node holding the options */
  readonly discriminator?: string;
}

/** The policies a view of the plan sets, which are not part of the recursion rule */
export interface PlanPolicy<S extends StrictRJSFSchema = RJSFSchema> {
  /** Which `allOf`s are merged: all of them (`true`, as the form renders them); none but the seeds' conjunction
   * (`false`); or, for the defaults view, those of a field whose seed resolves to a schema with an `if` (`'if'`), whose
   * defaults are those of the whole schema the field renders
   */
  readonly allOf: boolean | 'if';
  /** Whether an `if` applies its `then` or `else`; unless it is `false`, it does. When it does not, the `if`, `then` and
   * `else` stay on the merged schema as they stand.
   */
  readonly conditions?: boolean;
  /** Whether a `$ref` whose target is already on the ref path it is entered with is left unfollowed, which is how a
   * field the recursion rule collapsed keeps everything but its recursive edges
   */
  readonly cutRecursion?: boolean;
  /** Chooses the option merged into the field for each `anyOf`/`oneOf` met; none is merged when this is absent or it
   * returns undefined. The chosen option's ref path restarts, as the option `MultiSchemaField` renders does, unless
   * `optionsInheritRefPath` is set.
   */
  readonly selectOption?: (request: OptionRequest<S>) => number | undefined;
  /** Whether the chosen option keeps the ref path of the node offering it instead of restarting it. A restart is
   * bounded by the data only where the data reaches the option, so an option the defaults choose without data keeps the
   * path and its recursion collapses like any other.
   */
  readonly optionsInheritRefPath?: boolean;
}

/** A policy with its defaults filled in */
type ResolvedPolicy<S extends StrictRJSFSchema> = Required<Omit<PlanPolicy<S>, 'selectOption'>> &
  Pick<PlanPolicy<S>, 'selectOption'>;

/** A field's merge plan: its ordered entries, their set, and the merged schema with its children's seeds */
export interface MergePlan<S extends StrictRJSFSchema = RJSFSchema> {
  readonly graph: SchemaGraph<S>;
  readonly seeds: readonly Seed[];
  readonly entries: readonly PlanEntry[];
  readonly set: ReadonlySet<NodeId>;
  /** The set as a string, equal for equal sets, which the set-equality guard compares */
  readonly setKey: string;
  /** The merged schema, with `RJSF_REF_KEY` naming the `$ref` the field's own node was resolved from */
  readonly schema: S;
  /** The chains of the plan in the order a child's seeds are merged in: a branch's before the keywords it is merged
   * into, a conjunction's members after them, so the first seed of a child is the one whose keywords win
   */
  readonly chains: readonly Keywords<S>[];
  readonly choices: readonly OptionChoice[];
  /** Whether the plan was built from the data, which it is only where it checked a condition, qualified a dependency or
   * asked for an option; a plan that was not holds for any data
   */
  readonly readsData: boolean;
}

/** What `buildPlan()` plans a field from */
export interface PlanInput<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType> {
  readonly context: SchemaContext<S, F>;
  readonly graph: SchemaGraph<S>;
  readonly seeds: readonly Seed[];
  /** The field's data, which an `if` and option choice read */
  readonly data?: unknown;
  /** The data `dependencies` qualify against, the field's data unless given: the defaults view passes the defaults
   * accumulated so far under the data
   */
  readonly depData?: unknown;
  readonly policy?: PlanPolicy<S>;
}

/** The data an `if` is checked against when the field has none */
const NO_DATA = Object.freeze({});

const conditionMemo = new KeyedMemo<boolean>();
/** The plans, a plan whose build read nothing of the data stored for any data: that lets a field whose data is a new
 * object each time, as an object field's is on every edit, reuse its plan
 */
const plans = new KeyedMemo<MergePlan<StrictRJSFSchema>>();

/** Returns the keywords of `source` on a schema of the plan's type. A literal or a merge result is not known to be an
 * `S`, so the copy starts as `template`, which is one, with every keyword removed. A `source` that is not an object,
 * which only an `allOf` merge with a `false` member returns, has no keywords to copy.
 */
export function schemaFrom<S extends StrictRJSFSchema, U>(template: S, source: U): S {
  const schema = { ...template };
  for (const key of Reflect.ownKeys(schema)) {
    Reflect.deleteProperty(schema, key);
  }
  return Object.assign(schema, source);
}

/** The keys of the seed lists, which are never changed once made, so a list a plan hands out is keyed once */
const seedKeys = new WeakMap<readonly Seed[], string>();

export function seedsKey(seeds: readonly Seed[]): string {
  let key = seedKeys.get(seeds);
  if (key === undefined) {
    key = seeds.map(({ node, refPath }) => `${node}:${refPath.join('.')}`).join(';');
    seedKeys.set(seeds, key);
  }
  return key;
}

/** A node's merged schema so far and the chains its children are seeded from */
interface Part<S extends StrictRJSFSchema> {
  schema: S;
  chains: readonly Keywords<S>[];
}

export function withoutKeys<S extends StrictRJSFSchema>(schema: S, ...keys: (string | symbol)[]): S {
  const copy = { ...schema };
  for (const key of keys) {
    Reflect.deleteProperty(copy, key);
  }
  return copy;
}

function symbolsOf(schemas: readonly object[]): Map<symbol, unknown> {
  const symbols = new Map<symbol, unknown>();
  for (const schema of schemas) {
    for (const symbol of Object.getOwnPropertySymbols(schema)) {
      if (!symbols.has(symbol)) {
        symbols.set(symbol, Reflect.get(schema, symbol));
      }
    }
  }
  return symbols;
}

/** The schema a boolean subschema reads as: `true` as `{}`, `false` as `{ not: {} }` */
export function booleanSchema<S extends StrictRJSFSchema>(node: SchemaNode<S>, template: S): S {
  return schemaFrom(template, node.kind === 'boolean' && !node.value ? { not: {} } : {});
}

/** Merges `branch` into `part` with `mergeSchemas()`, the branch's keywords winning, keeping the `RJSF_REF_KEY` of
 * `part` when it has one, so the merged schema is still named after the field's own `$ref`
 */
function mergeBranch<S extends StrictRJSFSchema>(part: Part<S>, branch: Part<S>): Part<S> {
  const schema = schemaFrom(part.schema, mergeSchemas(part.schema, branch.schema));
  const ownRef: unknown = Reflect.get(part.schema, RJSF_REF_KEY);
  if (ownRef !== undefined) {
    Reflect.set(schema, RJSF_REF_KEY, ownRef);
  }
  return { schema, chains: [...branch.chains, ...part.chains] };
}

function withRequired<S extends StrictRJSFSchema>(schema: S, required: readonly string[]): S {
  const existing = schema.required;
  return { ...schema, required: Array.isArray(existing) ? [...new Set([...existing, ...required])] : [...required] };
}

/** The policies plans are built under, by validator, graph and key */
const policies = new KeyedMemo<object>();

function isPolicy<S extends StrictRJSFSchema>(value: unknown): value is PlanPolicy<S> {
  return typeof value === 'object' && value !== null && 'allOf' in value;
}

/** Returns the policy `create` makes for `key`, made once per validator and graph: a plan is memoized under its policy
 * object, so a view asking for the same policy again must be handed the same object. A policy reads nothing of the
 * context but its validator, which is what lets views called with a new context object each time share one.
 *
 * @param validator - The validator the policy's option choice validates with
 * @param graph - The graph the policy plans in, whose node ids a key may name
 * @param key - Names the policy among the validator's
 * @param create - Makes the policy the first time it is asked for
 * @returns - The policy
 */
export function cachedPolicy<S extends StrictRJSFSchema = RJSFSchema>(
  validator: object,
  graph: SchemaGraph<S>,
  key: string,
  create: () => PlanPolicy<S>,
): PlanPolicy<S> {
  const keys = [validator, graph, key];
  const cached = policies.peek(keys);
  if (isPolicy<S>(cached)) {
    return cached;
  }
  const policy = create();
  policies.set(keys, policy);
  return policy;
}

/** Returns the node a `$ref` target reads as where a `$ref` reaches it: its `conjunction`, where it has one
 *
 * @param graph - The graph the target is in
 * @param target - The target
 * @returns - The node whose keywords the target contributes
 */
export function asTarget<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, target: ObjectNode<S>): ObjectNode<S> {
  const conjunction = target.conjunction === undefined ? undefined : graph.node(target.conjunction);
  return conjunction?.kind === 'schema' ? conjunction : target;
}

/** Returns the schema holding each of `keywords` as the node providing it holds it */
function keywordSchema<S extends StrictRJSFSchema>(template: S, keywords: Keywords<S>): S {
  return schemaFrom(
    template,
    Object.fromEntries([...keywords].map(([key, provider]) => [key, Reflect.get(provider.node.raw, key)])),
  );
}

/** Returns the keywords of `node` with the node providing each: the target's, overridden by the keywords beside its
 * `$ref`, along the whole chain of references, each target read as `asTarget()` reads it. `enter` is asked before each
 * target is followed, with the ref path extended by it; one it declines adds nothing.
 */
function flattenRef<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  node: ObjectNode<S>,
  refPath: RefPath,
  enter: (target: NodeId, refPath: RefPath) => boolean,
): Map<string | symbol, Provider<S>> {
  const keywords = new Map<string | symbol, Provider<S>>();
  const target = node.ref === undefined ? undefined : graph.node(node.ref);
  if (target?.kind === 'invalid') {
    throw new Error(target.message);
  }
  if (target !== undefined) {
    const path = [...refPath, target.id];
    if (enter(target.id, path) && target.kind === 'schema') {
      for (const [key, provider] of flattenRef(graph, asTarget(graph, target), path, enter)) {
        keywords.set(key, provider);
      }
    }
  }
  for (const key of Reflect.ownKeys(node.raw)) {
    if (key !== REF_KEY) {
      keywords.set(key, { node, refPath });
    }
  }
  return keywords;
}

/** The definitions `refDefinition()` read, by graph and node */
const definitions = new KeyedMemo<object>();

/** Returns the definition the `$ref` of the node `from` names, read as the plan reads a `$ref` target, its chain of
 * references followed, so that the form and the scoring of options read a reference alike. A boolean definition reads
 * as the empty schema, and so does a node holding no `$ref`. The definition is made once per node and shared, so a
 * caller copies it rather than changing it.
 *
 * @param graph - The graph holding the node
 * @param from - The node holding the reference
 * @returns - The definition
 * @throws - An error for a reference that resolves to nothing or a chain of references that loops
 */
export function refDefinition<S extends StrictRJSFSchema = RJSFSchema>(graph: SchemaGraph<S>, from: NodeId): S {
  const keys = [graph, from];
  const known = definitions.peek(keys);
  if (isSchemaObject<S>(known)) {
    return known;
  }
  const definition = readRefDefinition(graph, from);
  definitions.set(keys, definition);
  return definition;
}

function readRefDefinition<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, from: NodeId): S {
  const node = graph.node(from);
  const target = node.kind === 'schema' && node.ref !== undefined ? graph.node(node.ref) : undefined;
  if (target?.kind === 'invalid') {
    throw new Error(target.message);
  }
  if (target?.kind !== 'schema') {
    return schemaFrom(graph.rawRoot, {});
  }
  const keywords = flattenRef(graph, asTarget(graph, target), [], () => true);
  return keywordSchema(target.raw, keywords);
}

/** Builds one field's plan. Entries are added in this order: the `$ref` override, the chosen option, the
 * `dependencies`, the `then` or `else`, and the `allOf` entries. The order decides which entry's keyword wins where two
 * declare it, and the order the merged `properties` render in. A node already in the plan is not added again and adds
 * nothing to the schema, so `X AND X` is `X`.
 */
class PlanBuilder<S extends StrictRJSFSchema, F extends FormContextType> {
  private readonly entries: PlanEntry[] = [];
  private readonly seen = new Set<NodeId>();
  private readonly choices: OptionChoice[] = [];
  private readonly context: SchemaContext<S, F>;
  private readonly graph: SchemaGraph<S>;
  private readonly data: unknown;
  private readonly depData: unknown;
  private readonly policy: ResolvedPolicy<S>;
  private mergeAllOf: boolean;
  private readsData = false;
  /** How many `then`, `else` and `dependencies` branches are being expanded: a branch has its `allOf` merged whatever
   * the policy, as `retrieveSchema()` retrieves a branch whole before merging it
   */
  private branchDepth = 0;

  constructor(
    context: SchemaContext<S, F>,
    graph: SchemaGraph<S>,
    data: unknown,
    depData: unknown,
    policy: ResolvedPolicy<S>,
  ) {
    this.context = context;
    this.graph = graph;
    this.data = data;
    this.depData = depData;
    this.policy = policy;
    this.mergeAllOf = policy.allOf === true;
  }

  build(seeds: readonly Seed[]): MergePlan<S> {
    const empty = { schema: schemaFrom(this.graph.rawRoot, {}), chains: [] };
    const [first = empty, ...rest] = seeds.flatMap((seed) => this.expand(seed.node, seed.refPath, 'seed', true) ?? []);
    // Several seeds are merged as the `allOf` of them all, which is how a property is merged with the patterns its name
    // matches, so a `customMergeAllOf` is handed them as it is handed every other conjunction
    const merged = rest.length === 0 ? first : this.conjoin(empty, [first, ...rest]);
    return {
      graph: this.graph,
      seeds,
      entries: this.entries,
      set: this.seen,
      setKey: [...this.seen].sort((a, b) => a - b).join(','),
      schema: merged.schema,
      chains: merged.chains,
      choices: this.choices,
      readsData: this.readsData,
    };
  }

  private enter(node: NodeId, edge: PlanEdge, refPath: RefPath): boolean {
    if (this.seen.has(node)) {
      return false;
    }
    this.seen.add(node);
    this.entries.push({ node, edge, refPath });
    return true;
  }

  private flatten(node: ObjectNode<S>, refPath: RefPath): Map<string | symbol, Provider<S>> {
    return flattenRef(this.graph, node, refPath, (target, path) => {
      const cut = this.policy.cutRecursion && path.slice(0, -1).includes(target);
      return !cut && this.enter(target, 'ref', path);
    });
  }

  private expand(
    id: NodeId,
    refPath: RefPath,
    edge: PlanEdge,
    top: boolean,
    dependencyKey?: string,
  ): Part<S> | undefined {
    if (!this.enter(id, edge, refPath)) {
      return undefined;
    }
    const node = this.graph.node(id);
    if (node.kind !== 'schema') {
      return { schema: booleanSchema(node, this.graph.rawRoot), chains: [] };
    }
    const keywords = this.flatten(node, refPath);
    if (top && this.policy.allOf === 'if' && keywords.has(IF_KEY)) {
      this.mergeAllOf = true;
    }
    const schema = keywordSchema(node.raw, keywords);
    const ref: unknown = Reflect.get(node.raw, REF_KEY);
    if (typeof ref === 'string') {
      Reflect.set(schema, RJSF_REF_KEY, ref);
    }
    let part: Part<S> = { schema, chains: [keywords] };
    if (dependencyKey === undefined) {
      const dependencies = keywords.has(DEPENDENCIES_KEY);
      part = this.applyOption(part, ANY_OF_KEY, keywords.get(ANY_OF_KEY), dependencies);
      part = this.applyOption(part, ONE_OF_KEY, keywords.get(ONE_OF_KEY), dependencies);
    }
    part = this.applyDependencies(part, keywords.get(DEPENDENCIES_KEY), keywords.get(PROPERTIES_KEY));
    if (this.policy.conditions) {
      part = this.applyCondition(part, keywords, dependencyKey);
    }
    part = this.applyAllOf(part, keywords.get(ALL_OF_KEY), dependencyKey);
    return dependencyKey === undefined ? part : this.applyExactlyOne(part, dependencyKey, keywords.get(ONE_OF_KEY));
  }

  /** Merges the `allOf` entries in. Inside a dependency, each entry's own `oneOf` is applied as the dependency's is,
   * since the entries are part of the dependency's schema
   */
  private applyAllOf(part: Part<S>, provider: Provider<S> | undefined, dependencyKey: string | undefined): Part<S> {
    if (provider === undefined || (!this.mergeAllOf && this.branchDepth === 0)) {
      return part;
    }
    const members = this.graph
      .subschemas(provider.node.id, ALL_OF_KEY)
      .flatMap(([, member]) => this.expand(member, provider.refPath, 'allOf', false, dependencyKey) ?? []);
    return this.conjoin({ ...part, schema: withoutKeys(part.schema, ALL_OF_KEY) }, members);
  }

  /** Merges `members` into `part` as `allOf` merges them, first wins, and re-applies the symbols the merge drops, the
   * part's own before its members'
   */
  private conjoin(part: Part<S>, members: readonly Part<S>[]): Part<S> {
    if (members.length === 0) {
      return part;
    }
    const schemas = [part.schema, ...members.map((member) => member.schema)];
    const merged = this.mergeAll({ ...part.schema, [ALL_OF_KEY]: schemas.slice(1) });
    for (const [symbol, value] of symbolsOf(schemas)) {
      Reflect.set(merged, symbol, value);
    }
    return {
      schema: merged,
      chains: [...part.chains, ...members.flatMap((member) => member.chains)],
    };
  }

  private mergeAll(schema: S): S {
    try {
      return this.context.customMergeAllOf
        ? this.context.customMergeAllOf(schema)
        : schemaFrom(schema, shallowAllOfMerge(schema));
    } catch (error) {
      logOnce('could not merge subschemas in allOf:\n', 'warn', error);
      return withoutKeys(schema, ALL_OF_KEY);
    }
  }

  private holds(key: string, condition: S, data: unknown): boolean {
    this.readsData = true;
    // The memo stores no check of an object, which a caller may mutate in place between builds
    if (typeof data === 'object' && data !== null) {
      return this.context.validator.isValid(condition, data, this.graph.rawRoot);
    }
    const keys = [this.context.validator, this.graph, key];
    const memoized = conditionMemo.peekLatest(keys, [data]);
    if (memoized !== undefined) {
      return memoized;
    }
    const holds = this.context.validator.isValid(condition, data ?? NO_DATA, this.graph.rawRoot);
    conditionMemo.setLatest(keys, [data], holds);
    return holds;
  }

  /** Applies the `then` or `else` the `if` chooses on the field's own data, `{}` standing in for none. Inside a
   * dependency, the branch's own `oneOf` is applied as the dependency's is.
   */
  private applyCondition(
    part: Part<S>,
    keywords: ReadonlyMap<string | symbol, Provider<S>>,
    dependencyKey: string | undefined,
  ): Part<S> {
    const conditionProvider = keywords.get(IF_KEY);
    if (conditionProvider === undefined) {
      return part;
    }
    const condition = this.graph.child(conditionProvider.node.id, IF_KEY);
    const without = { ...part, schema: withoutKeys(part.schema, IF_KEY, THEN_KEY, ELSE_KEY) };
    if (condition === undefined) {
      return without;
    }
    const conditionNode = this.graph.node(condition);
    const conditionSchema =
      conditionNode.kind === 'schema' ? conditionNode.raw : booleanSchema(conditionNode, this.graph.rawRoot);
    const branchKey = this.holds(`if:${condition}`, conditionSchema, this.data) ? THEN_KEY : ELSE_KEY;
    const branchPart = this.branch(keywords.get(branchKey), branchKey, dependencyKey);
    return branchPart === undefined ? without : mergeBranch(without, branchPart);
  }

  private branch(
    provider: Provider<S> | undefined,
    key: 'then' | 'else',
    dependencyKey: string | undefined,
  ): Part<S> | undefined {
    if (provider === undefined) {
      return undefined;
    }
    const branch = this.graph.child(provider.node.id, key);
    return branch === undefined ? undefined : this.expandBranch(branch, provider.refPath, key, dependencyKey);
  }

  private expandBranch(id: NodeId, refPath: RefPath, edge: PlanEdge, dependencyKey?: string): Part<S> | undefined {
    this.branchDepth += 1;
    try {
      return this.expand(id, refPath, edge, false, dependencyKey);
    } finally {
      this.branchDepth -= 1;
    }
  }

  /** Applies each dependency whose key the dependency data has, which the node declaring it declares as a property or
   * declares no properties at all, its `$ref` followed and overridden by the keywords beside it. A property a
   * dependency applied before it declares counts as declared, so the first qualifying key in order is applied until
   * none is left. Judging these rather than the merged schema keeps a dependency from being disqualified by a property
   * a later merge adds.
   */
  private applyDependencies(
    part: Part<S>,
    provider: Provider<S> | undefined,
    propertiesProvider: Provider<S> | undefined,
  ): Part<S> {
    if (provider === undefined) {
      return part;
    }
    this.readsData = true;
    let next: Part<S> = { ...part, schema: withoutKeys(part.schema, DEPENDENCIES_KEY) };
    const ownProperties: unknown = propertiesProvider && Reflect.get(propertiesProvider.node.raw, PROPERTIES_KEY);
    const declared = isObject(ownProperties) ? new Set(Object.keys(ownProperties)) : undefined;
    const dependencies: unknown = provider.node.raw[DEPENDENCIES_KEY];
    const pending = Object.entries(isObject(dependencies) ? dependencies : {}).flatMap(
      ([key, dependency]): [string, string[] | NodeId][] => {
        if (Array.isArray(dependency)) {
          return [[key, dependency.filter((entry): entry is string => typeof entry === 'string')]];
        }
        const schema = this.graph.child(provider.node.id, DEPENDENCIES_KEY, key);
        return schema === undefined ? [] : [[key, schema]];
      },
    );
    const qualifies = ([key]: [string, unknown]) =>
      getByPath(this.depData, key) !== undefined && (declared === undefined || declared.has(key));
    for (let index = pending.findIndex(qualifies); index >= 0; index = pending.findIndex(qualifies)) {
      const [[key, dependency]] = pending.splice(index, 1);
      if (Array.isArray(dependency)) {
        next = { ...next, schema: withRequired(next.schema, dependency) };
      } else {
        const dependent = this.expandBranch(dependency, provider.refPath, 'dependency', key);
        if (dependent !== undefined) {
          Object.keys(dependent.schema.properties ?? {}).forEach((name) => declared?.add(name));
          next = mergeBranch(next, { ...dependent, schema: withoutKeys(dependent.schema, ONE_OF_KEY) });
        }
      }
    }
    return next;
  }

  /** The subschema an option of a dependency's `oneOf` names its condition with: its `properties[key]`, read off the
   * option as written, or, for an option spelled as a `$ref`, off the schema it resolves to
   */
  private dependencyCondition(option: NodeId, key: string): unknown {
    const node = this.graph.node(option);
    if (node.kind !== 'schema') {
      return undefined;
    }
    if (node.ref === undefined) {
      const condition = this.graph.child(option, PROPERTIES_KEY, key);
      if (condition === undefined) {
        return undefined;
      }
      const conditionNode = this.graph.node(condition);
      return conditionNode.kind === 'schema'
        ? conditionNode.raw
        : conditionNode.kind === 'boolean' && conditionNode.value;
    }
    const resolved = new PlanBuilder(this.context, this.graph, this.data, this.depData, {
      ...this.policy,
      allOf: true,
    }).build([{ node: option, refPath: [] }]);
    const properties: unknown = resolved.schema.properties;
    return isObject(properties) ? properties[key] : undefined;
  }

  /** Applies the one option of a dependency's `oneOf` whose `properties[key]` the data satisfies, less that property;
   * with no such option or several, none is applied
   */
  private applyExactlyOne(part: Part<S>, key: string, provider: Provider<S> | undefined): Part<S> {
    if (provider === undefined) {
      return part;
    }
    const valid = this.graph
      .subschemas(provider.node.id, ONE_OF_KEY)
      .map(([, option]) => option)
      .filter((option) => {
        const condition = this.dependencyCondition(option, key);
        if (!condition) {
          return false;
        }
        const conditionSchema = schemaFrom(this.graph.rawRoot, { type: 'object', properties: { [key]: condition } });
        return this.holds(`dependency:${option}:${key}`, conditionSchema, this.depData);
      });
    if (valid.length !== 1) {
      logOnce(`ignoring oneOf in dependencies of "${key}" because there isn't exactly one subschema that is valid`);
      return part;
    }
    const chosen = this.expandBranch(valid[0], provider.refPath, 'dependency');
    if (chosen === undefined) {
      return part;
    }
    const properties = { ...chosen.schema.properties };
    Reflect.deleteProperty(properties, key);
    const schema = { ...chosen.schema };
    Reflect.set(schema, PROPERTIES_KEY, properties);
    const chains = chosen.chains.map((chain) => {
      const declaring = chain.get(PROPERTIES_KEY);
      return declaring === undefined ? chain : new Map(chain).set(PROPERTIES_KEY, { ...declaring, drops: key });
    });
    return mergeBranch(part, { schema, chains });
  }

  private applyOption(
    part: Part<S>,
    keyword: 'anyOf' | 'oneOf',
    provider: Provider<S> | undefined,
    dependencies: boolean,
  ): Part<S> {
    if (provider === undefined || !Array.isArray(provider.node.raw[keyword])) {
      return part;
    }
    const options = this.graph.subschemas(provider.node.id, keyword).map(([, option]) => option);
    const request = {
      keyword,
      provider: provider.node.id,
      refPath: provider.refPath,
      options,
      list: Reflect.get(provider.node.raw, keyword),
      dependencies,
    };
    this.readsData ||= this.policy.selectOption !== undefined;
    const chosen = this.policy.selectOption?.({
      ...request,
      graph: this.graph,
      data: this.data,
      depData: this.depData,
      discriminator: stringKeyword(Reflect.get(provider.node.raw, 'discriminator'), 'propertyName'),
    });
    const selected = chosen !== undefined && chosen >= 0 && chosen < options.length ? chosen : undefined;
    this.choices.push({ ...request, selected });
    const optionRefPath = this.policy.optionsInheritRefPath ? provider.refPath : [];
    const option = selected === undefined ? undefined : this.expand(options[selected], optionRefPath, 'option', false);
    return option === undefined ? part : mergeBranch(part, option);
  }
}

/** Returns the chains of `seeds` read as they stand, each seed's keywords provided by the seed itself: nothing the
 * seeds reach through a `$ref` or a branch is read, which is what a field the recursion rule collapsed keeps of its
 * own
 *
 * @param graph - The graph the seeds are in
 * @param seeds - The seeds whose own keywords are wanted
 * @returns - One chain per object seed
 */
export function ownChains<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  seeds: readonly Seed[],
): Keywords<S>[] {
  return seeds.flatMap(({ node: id, refPath }) => {
    const node = graph.node(id);
    return node.kind === 'schema'
      ? [new Map(Reflect.ownKeys(node.raw).flatMap((key) => (key === REF_KEY ? [] : [[key, { node, refPath }]])))]
      : [];
  });
}

/** Whether a plan read back from the memo, which holds the plans of every schema type, is one of `graph` */
function isPlanOf<S extends StrictRJSFSchema>(
  value: MergePlan<StrictRJSFSchema> | undefined,
  graph: SchemaGraph<S>,
): value is MergePlan<S> {
  return value?.graph === graph;
}

/** Builds the merge plan of the field `input.seeds` seed, memoized per seeds, data, policy and context: the same
 * inputs give the same plan object while the data is the last the plan was built for, and a plan whose build read
 * nothing of the data is the same object for any data. A check of an `if` or a dependency condition is memoized per
 * node for the last data it was made on, so a parent's lookahead and the child's own build do not check the same
 * condition twice, unless the data is an object, which is checked again on every build.
 *
 * @param input - The graph, seeds, data, policy and context of the field
 * @returns - The field's merge plan
 * @throws - An error for a `$ref` the plan enters that resolves to nothing or a chain of references that loops
 */
export default function buildPlan<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  input: PlanInput<S, F>,
): MergePlan<S> {
  const { context, graph, seeds, data, policy } = input;
  const depData = input.depData === undefined ? data : input.depData;
  const resolved: ResolvedPolicy<S> = {
    allOf: policy?.allOf ?? true,
    conditions: policy?.conditions ?? true,
    cutRecursion: policy?.cutRecursion ?? false,
    selectOption: policy?.selectOption,
    optionsInheritRefPath: policy?.optionsInheritRefPath ?? false,
  };
  const keys = [
    context.validator,
    context.customMergeAllOf,
    graph,
    seedsKey(seeds),
    resolved.allOf,
    resolved.conditions,
    resolved.cutRecursion,
    resolved.selectOption,
    resolved.optionsInheritRefPath,
  ];
  const memoized = plans.peekAny(keys, [data, depData]);
  if (isPlanOf(memoized, graph)) {
    return memoized;
  }
  const plan = new PlanBuilder(context, graph, data, depData, resolved).build(seeds);
  if (plan.readsData) {
    plans.setLatest(keys, [data, depData], plan);
  } else {
    plans.set(keys, plan);
  }
  return plan;
}

/** The graph and chains a field's children are seeded from */
export interface Seeding<S extends StrictRJSFSchema = RJSFSchema> {
  readonly graph: SchemaGraph<S>;
  readonly chains: readonly Keywords<S>[];
}

/** Returns the seeds of the subschema `keyword` holds, or holds under `key`, in each chain providing the keyword
 *
 * @param seeding - The field's graph and chains
 * @param keyword - The keyword holding the child
 * @param [key] - The child's key in the map or list the keyword holds
 * @returns - The child's seeds, in merge order
 */
export function seedsAt<S extends StrictRJSFSchema = RJSFSchema>(
  { graph, chains }: Seeding<S>,
  keyword: string,
  key?: string,
): Seed[] {
  return chains.flatMap((chain) => {
    const provider = chain.get(keyword);
    const node =
      provider && (key === undefined || provider.drops !== key)
        ? graph.child(provider.node.id, keyword, key)
        : undefined;
    return provider === undefined || node === undefined ? [] : [{ node, refPath: provider.refPath }];
  });
}

/** Returns the seeds of a tuple's item at `index`: under `prefixItems`, or under `items` in a chain that holds a list
 * there
 *
 * @param seeding - The array field's graph and chains
 * @param index - The item's index
 * @returns - The item's seeds, in merge order
 */
export function tupleSeeds<S extends StrictRJSFSchema = RJSFSchema>(seeding: Seeding<S>, index: number): Seed[] {
  return seeding.chains.flatMap((chain) => {
    const tuple = ['prefixItems', ITEMS_KEY].find((keyword) => {
      const provider = chain.get(keyword);
      return provider !== undefined && Array.isArray(Reflect.get(provider.node.raw, keyword));
    });
    return tuple === undefined ? [] : seedsAt({ graph: seeding.graph, chains: [chain] }, tuple, String(index));
  });
}

/** Returns the seeds of the child of an object field at `key`, and the containment edge it is reached through: a
 * declared property, merged with each pattern matching its name; else the patterns its name matches; else the
 * additional properties
 *
 * @param seeding - The object field's graph and chains
 * @param key - The child's key
 * @returns - The child's seeds, in merge order, and its edge; for a declared property, whether patterns are merged in
 */
export function childSeeds<S extends StrictRJSFSchema = RJSFSchema>(
  seeding: Seeding<S>,
  key: string,
):
  | { seeds: readonly Seed[]; edge: 'property'; patterned: boolean }
  | { seeds: readonly Seed[]; edge: 'patternKey' | 'additionalKey' } {
  const patterns = seeding.chains.flatMap((chain) => {
    const provider = chain.get(PATTERN_PROPERTIES_KEY);
    return provider === undefined
      ? []
      : seeding.graph
          .subschemas(provider.node.id, PATTERN_PROPERTIES_KEY)
          .filter(([pattern]) => patternRegExp(pattern).test(key))
          .map(([, node]) => ({ node, refPath: provider.refPath }));
  });
  const declared = seedsAt(seeding, PROPERTIES_KEY, key);
  if (declared.length > 0) {
    return { seeds: [...declared, ...patterns], edge: 'property', patterned: patterns.length > 0 };
  }
  return patterns.length > 0
    ? { seeds: patterns, edge: 'patternKey' }
    : { seeds: seedsAt(seeding, ADDITIONAL_PROPERTIES_KEY), edge: 'additionalKey' };
}
