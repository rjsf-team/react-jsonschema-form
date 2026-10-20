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
import type { CustomMergeAllOf, FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../../types.ts';
import shallowAllOfMerge from '../shallowAllOfMerge.ts';
import KeyedMemo from './keyedMemo.ts';
import { stringKeyword } from './parseSchemaGraph.ts';
import type { NodeId, ObjectNode, SchemaGraph, SchemaNode } from './parseSchemaGraph.ts';

/** The `$ref` targets entered on the way to a plan entry, from the nearest point the recursion rule restarts it at */
export type RefPath = readonly NodeId[];

/** Returns how often `target` occurs on `refPath` before its last entry, the ref path in effect where that entry was
 * entered
 *
 * @param refPath - The ref path, ending at the target just entered
 * @param target - The target to count
 * @returns - The number of occurrences
 */
export function occurrencesBeforeLast(refPath: RefPath, target: NodeId): number {
  let count = 0;
  for (let index = 0; index < refPath.length - 1; index += 1) {
    if (refPath[index] === target) {
      count += 1;
    }
  }
  return count;
}

/** A containment node a field is reached through, with the ref path of the plan entry that declares it */
export interface Seed {
  readonly node: NodeId;
  readonly refPath: RefPath;
  /** Where the node sits among the branches and `allOf` entries of the schemas declaring it, outermost first: the seeds
   * of a field are merged as those schemas were, see `Scope`
   */
  readonly scope?: Scope;
}

/** A path of steps from a field's own seeds to a seed declared inside a branch or an `allOf` entry. A `then`/`else` or
 * `dependencies` entry (`b<node>`) is merged over the schema declaring it and an `allOf` entry (`a<node>`) is
 * conjoined with it, so the seeds of each step are merged first and then into the seeds around them the same way. A
 * chosen option (`o<node>`) is merged over the whole field wherever it sits, as the form merges the option it renders.
 */
export type Scope = readonly string[];

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
  /** Where the node sits among the branches and `allOf` entries of the schemas declaring it, see `Seed.scope` */
  readonly scope?: Scope;
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
  /** Which `allOf`s are merged: all of them (`true`, as the form renders them); none but the conjunctions keywords
   * beside a `$ref` read as (`false`); or, for the defaults view, those of a field whose seed resolves to a schema with an `if` (`'if'`), whose
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
  /** The `allOf` and `if` policies a chosen option is expanded under, where they are not the field's own: a field the
   * defaults read whole, as `retrieveSchema()` resolves it, merges its own `allOf` and `if` but not those of an option
   * it is merged with, which `allOf: 'if'` merges only where the field's own keywords hold an `if`
   */
  readonly optionPolicy?: OptionPolicy;
}

/** The `allOf` and `if` policies of `PlanPolicy.optionPolicy` */
export interface OptionPolicy {
  readonly allOf: boolean | 'if';
  readonly conditions: boolean;
}

/** A policy with its defaults filled in */
type ResolvedPolicy<S extends StrictRJSFSchema> = Required<Omit<PlanPolicy<S>, 'selectOption' | 'optionPolicy'>> &
  Pick<PlanPolicy<S>, 'selectOption' | 'optionPolicy'>;

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
   * into and marked as a branch's, a conjunction's members after them, so the first of a child's seeds that no branch
   * holds is the one whose keywords win among those, and a branch's are merged over them
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
    key = seeds.map(({ node, refPath, scope }) => `${node}:${refPath.join('.')}@${scope?.join('.') ?? ''}`).join(';');
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

/** Returns the schema the boolean subschema `value` reads as: `true` as `{}`, `false` as `{ not: {} }`
 *
 * @param value - The boolean subschema
 * @param template - A schema of the type to return, whose keywords are not copied
 * @returns - The object schema
 */
export function schemaOfBoolean<S extends StrictRJSFSchema>(value: boolean, template: S): S {
  return schemaFrom(template, value ? {} : { not: {} });
}

/** The schema a boolean node reads as, as `schemaOfBoolean()` reads its value; any other node reads as `{}` */
export function booleanSchema<S extends StrictRJSFSchema>(node: SchemaNode<S>, template: S): S {
  return schemaOfBoolean(node.kind !== 'boolean' || node.value, template);
}

/** Returns `chain` with `step` put before the scope of each of its providers, see `Scope`, but for those of a chosen
 * option, which stay where they are
 */
function scopedChain<S extends StrictRJSFSchema>(chain: Keywords<S>, step: string): Keywords<S> {
  return new Map(
    [...chain].map(([key, provider]) => [
      key,
      provider.scope?.[0]?.startsWith('o') ? provider : { ...provider, scope: [step, ...(provider.scope ?? [])] },
    ]),
  );
}

function scopedPart<S extends StrictRJSFSchema>(part: Part<S>, step: string): Part<S> {
  return { ...part, chains: part.chains.map((chain) => scopedChain(chain, step)) };
}

/** Merges `branch` into `part` with `mergeSchemas()`, the branch's keywords winning, keeping the `RJSF_REF_KEY` of
 * `part` when it has one, so the merged schema is still named after the field's own `$ref`
 */
function mergeOver<S extends StrictRJSFSchema>(part: Part<S>, branch: Part<S>): Part<S> {
  const schema = schemaFrom(part.schema, mergeSchemas(part.schema, branch.schema));
  const ownRef: unknown = Reflect.get(part.schema, RJSF_REF_KEY);
  if (ownRef !== undefined) {
    Reflect.set(schema, RJSF_REF_KEY, ownRef);
  }
  return { schema, chains: [...branch.chains, ...part.chains] };
}

/** Merges the branch declared at `node` into `part` as `mergeOver()` does, with the branch's chains scoped by `kind`
 * (`b` for a `then`/`else` or `dependencies` entry, `o` for a chosen option), so that a child they seed is merged
 * the same way
 */
function mergeBranch<S extends StrictRJSFSchema>(
  part: Part<S>,
  branch: Part<S>,
  kind: 'b' | 'o',
  node: NodeId,
): Part<S> {
  return mergeOver(part, scopedPart(branch, `${kind}${node}`));
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

/** Returns the policy `create` makes for `key`, made once per validator, `customMergeAllOf` and graph: a plan is
 * memoized under its policy object, so a view asking for the same policy again must be handed the same object. A policy
 * reads nothing of the context but those two, which is what lets views called with a new context object each time
 * share one.
 *
 * @param context - The context whose validator the policy's option choice validates with, and whose `customMergeAllOf`
 *        it reads an option's own `$ref` with
 * @param graph - The graph the policy plans in, whose node ids a key may name
 * @param key - Names the policy among the validator's
 * @param create - Makes the policy the first time it is asked for
 * @returns - The policy
 */
export function cachedPolicy<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  { validator, customMergeAllOf }: SchemaContext<S, F>,
  graph: SchemaGraph<S>,
  key: string,
  create: () => PlanPolicy<S>,
): PlanPolicy<S> {
  const keys = [validator, customMergeAllOf, graph, key];
  const cached = policies.peek(keys);
  if (isPolicy<S>(cached)) {
    return cached;
  }
  const policy = create();
  policies.set(keys, policy);
  return policy;
}

/** Returns the node a subschema reads as, whether it is a field's own or a `$ref` reaches it: its `conjunction`, where
 * it has one
 *
 * @param graph - The graph the subschema is in
 * @param target - The subschema
 * @returns - The node whose keywords the subschema contributes
 */
export function asTarget<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, target: ObjectNode<S>): ObjectNode<S> {
  const conjunction = target.conjunction === undefined ? undefined : graph.node(target.conjunction);
  return conjunction?.kind === 'schema' ? conjunction : target;
}

/** Returns the `conjunction` the node `from` reads as, for a `$ref` with keywords beside it other than annotations,
 * and undefined for any other node
 *
 * @param graph - The graph holding the node
 * @param from - The node
 * @returns - The conjunction, if the node has one
 */
export function conjunctionOf<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  from: NodeId,
): ObjectNode<S> | undefined {
  const node = graph.node(from);
  if (node.kind !== 'schema') {
    return undefined;
  }
  const conjunction = asTarget(graph, node);
  return conjunction === node ? undefined : conjunction;
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
  for (const [key, provider] of ownProviders(node, refPath)) {
    keywords.set(key, provider);
  }
  return keywords;
}

/** Returns the keywords `node` declares itself, its `$ref` aside, each provided by the node under `refPath` */
function ownProviders<S extends StrictRJSFSchema>(
  node: ObjectNode<S>,
  refPath: RefPath,
): Map<string | symbol, Provider<S>> {
  const providers = new Map<string | symbol, Provider<S>>();
  for (const key of Reflect.ownKeys(node.raw)) {
    if (key !== REF_KEY) {
      providers.set(key, { node, refPath });
    }
  }
  return providers;
}

/** Whether the schema the node `id` reads as declares `keyword` itself, along its chain of references, the members
 * of a `conjunction` counting as its own keywords, since they are the keywords written beside the `$ref`
 */
export function declaresKeyword<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  keyword: string,
): boolean {
  const node = graph.node(id);
  if (node.kind !== 'schema') {
    return false;
  }
  const conjunction = asTarget(graph, node);
  if (conjunction !== node) {
    return graph.subschemas(conjunction.id, ALL_OF_KEY).some(([, member]) => declaresKeyword(graph, member, keyword));
  }
  return Object.hasOwn(node.raw, keyword) || (node.ref !== undefined && declaresKeyword(graph, node.ref, keyword));
}

/** The definitions `refDefinition()` read, by graph, `customMergeAllOf` and node */
const definitions = new KeyedMemo<object>();

/** Returns the definition the `$ref` of the node `from` names, as the form reads it: the target with its own `$ref`s
 * followed, each one's annotations beside it over the target's, and any other keywords beside it merged with the
 * target as the `allOf` of both, by the `customMergeAllOf` a field's plan merges them with. A boolean definition reads
 * as the empty schema, and so does a node holding no `$ref`. The definition is made once per node and merge, and
 * shared, so a caller copies it rather than changing it.
 *
 * @param graph - The graph holding the node
 * @param from - The node holding the reference
 * @param [customMergeAllOf] - The merge of the context the form renders with, if it has one
 * @returns - The definition
 * @throws - An error for a reference that resolves to nothing or a chain of references that loops
 */
export function refDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  from: NodeId,
  customMergeAllOf?: CustomMergeAllOf<S>,
): S {
  const node = graph.node(from);
  return node.kind === 'schema' && node.ref !== undefined
    ? definitionOf(graph, node.ref, customMergeAllOf)
    : schemaFrom(graph.rawRoot, {});
}

/** Returns the `allOf` entries `schemas` hold themselves, which merging the schemas as the `allOf` of them leaves as they
 * stand: the shallow merge would flatten them into its result and hoist the `$ref` of an entry onto it, merging an
 * `allOf` that is not the one being merged and leaving a reference no reader of the result follows again
 */
function ownAllOf(schemas: readonly object[]): unknown[] {
  return schemas.flatMap((schema): unknown[] => {
    const entries: unknown = Reflect.get(schema, ALL_OF_KEY);
    return Array.isArray(entries) ? entries : [];
  });
}

/** Returns the `allOf` of `schema` merged into it as a field's plan merges one: by the `customMergeAllOf` given, or
 * else by the shallow merge
 *
 * @param schema - The schema holding the `allOf` to merge
 * @param [customMergeAllOf] - The merge of the context the form renders with, if it has one
 * @returns - The merged schema
 */
function mergedAllOf<S extends StrictRJSFSchema>(schema: S, customMergeAllOf?: CustomMergeAllOf<S>): S {
  return customMergeAllOf ? customMergeAllOf(schema) : schemaFrom(schema, shallowAllOfMerge(schema));
}

/** Returns the keywords `beside` a `$ref` and the `definition` it names merged as the `allOf` of both, as the form
 * merges them, by the same `customMergeAllOf`. Two that cannot be merged, such as a `type` beside the `$ref` that the
 * definition's `type` shares no value with, stay the `allOf` of both, which a validator reads the same way, rather than
 * failing every reader.
 *
 * @param template - A schema of the type to return, whose keywords are not copied
 * @param beside - The keywords beside the `$ref`
 * @param definition - The definition the `$ref` names
 * @param [customMergeAllOf] - The merge of the context the form renders with, if it has one
 * @returns - The merged schema, or the `allOf` of both where they cannot be merged
 */
export function conjoinDefinition<S extends StrictRJSFSchema>(
  template: S,
  beside: S,
  definition: S,
  customMergeAllOf?: CustomMergeAllOf<S>,
): S {
  const nested = ownAllOf([beside, definition]);
  try {
    const merged = schemaFrom(
      template,
      mergedAllOf(
        schemaFrom(template, {
          [ALL_OF_KEY]: [withoutKeys(beside, ALL_OF_KEY), withoutKeys(definition, ALL_OF_KEY)],
        }),
        customMergeAllOf,
      ),
    );
    return nested.length === 0 ? merged : schemaFrom(template, { ...merged, [ALL_OF_KEY]: nested });
  } catch (error) {
    logOnce('could not merge subschemas in allOf:\n', 'warn', error);
    return schemaFrom(template, { [ALL_OF_KEY]: [beside, definition] });
  }
}

/** Returns the schema the node `id` reads as, its own `$ref` followed as `refDefinition()` follows one */
function definitionOf<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  customMergeAllOf?: CustomMergeAllOf<S>,
): S {
  const keys = [graph, customMergeAllOf, id];
  const known = definitions.peek(keys);
  if (isSchemaObject<S>(known)) {
    return known;
  }
  const node = graph.node(id);
  if (node.kind === 'invalid') {
    throw new Error(node.message);
  }
  if (node.kind === 'boolean' || node.ref === undefined) {
    return node.kind === 'boolean' ? booleanSchema(node, graph.rawRoot) : node.raw;
  }
  const target = definitionOf(graph, node.ref, customMergeAllOf);
  const beside = withoutKeys(node.raw, REF_KEY);
  const definition =
    node.conjunction === undefined
      ? schemaFrom(node.raw, { ...target, ...beside })
      : conjoinDefinition(node.raw, beside, target, customMergeAllOf);
  definitions.set(keys, definition);
  return definition;
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
  private conditions: boolean;
  /** Whether the keywords of a seed hold an `if`, which `allOf: 'if'` merges the `allOf`s for */
  private seedHasCondition = false;
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
    this.conditions = policy.conditions;
  }

  build(seeds: readonly Seed[]): MergePlan<S> {
    // Decided before any seed is expanded, since it decides how each of them merges its `allOf`
    if (
      (this.policy.allOf === 'if' || this.policy.optionPolicy?.allOf === 'if') &&
      seeds.some((seed) => declaresKeyword(this.graph, seed.node, IF_KEY))
    ) {
      this.seedHasCondition = true;
      this.mergeAllOf ||= this.policy.allOf === 'if';
    }
    const expanded = seeds.flatMap((seed) => {
      const part = this.expand(seed.node, seed.refPath, 'seed');
      if (part === undefined) {
        return [];
      }
      const scope = seed.scope ?? [];
      const scoped = scope.reduceRight((scopedSoFar, step) => scopedPart(scopedSoFar, step), part);
      return [{ scope, part: scoped }];
    });
    const merged = this.mergeSeeds(expanded, 0);
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

  /** Merges the expanded seeds at `depth` of their scopes, see `Scope`. Several seeds of one step are merged as the
   * `allOf` of them all, which is how a property is merged with the patterns its name matches, so a `customMergeAllOf`
   * is handed them as it is handed every other conjunction. The branches are merged over them last to first, as they
   * were merged over the schema declaring them, and the `allOf` entries are conjoined with the result.
   */
  private mergeSeeds(expanded: readonly { scope: Scope; part: Part<S> }[], depth: number): Part<S> {
    const own: Part<S>[] = [];
    const steps = new Map<string, { scope: Scope; part: Part<S> }[]>();
    for (const item of expanded) {
      const step = item.scope[depth];
      if (step === undefined) {
        own.push(item.part);
      } else {
        steps.set(step, [...(steps.get(step) ?? []), item]);
      }
    }
    const over: Part<S>[] = [];
    const entries: Part<S>[] = [];
    for (const [step, items] of steps) {
      (step.startsWith('a') ? entries : over).push(this.mergeSeeds(items, depth + 1));
    }
    const empty = { schema: schemaFrom(this.graph.rawRoot, {}), chains: [] };
    const [first = over.pop(), ...rest] = own;
    if (first === undefined) {
      return entries.length === 1 ? entries[0] : this.conjoin(empty, entries);
    }
    if (over.length === 0) {
      return rest.length === 0 && entries.length === 0 ? first : this.conjoin(empty, [first, ...rest, ...entries]);
    }
    let merged = rest.length === 0 ? first : this.conjoin(empty, [first, ...rest]);
    for (let index = over.length - 1; index >= 0; index -= 1) {
      merged = mergeOver(merged, over[index]);
    }
    return entries.length === 0 ? merged : this.conjoin(empty, [merged, ...entries]);
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
      const cut = this.policy.cutRecursion && occurrencesBeforeLast(path, target) > 0;
      return !cut && this.enter(target, 'ref', path);
    });
  }

  private expand(id: NodeId, refPath: RefPath, edge: PlanEdge, dependencyKey?: string): Part<S> | undefined {
    if (!this.enter(id, edge, refPath)) {
      return undefined;
    }
    const node = this.graph.node(id);
    if (node.kind !== 'schema') {
      return { schema: booleanSchema(node, this.graph.rawRoot), chains: [] };
    }
    const keywords = this.flatten(asTarget(this.graph, node), refPath);
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
    // A dependency's `if` belongs to the entry its data qualified, so it is applied whatever the policy, as the entry's
    // `allOf` is merged
    if (this.conditions || dependencyKey !== undefined) {
      part = this.applyCondition(part, keywords, dependencyKey);
    }
    part = this.applyAllOf(part, keywords.get(ALL_OF_KEY), dependencyKey);
    return dependencyKey === undefined ? part : this.applyExactlyOne(part, dependencyKey, keywords.get(ONE_OF_KEY));
  }

  /** Merges the `allOf` entries in. Inside a dependency, each entry's own `oneOf` is applied as the dependency's is,
   * since the entries are part of the dependency's schema
   */
  private applyAllOf(part: Part<S>, provider: Provider<S> | undefined, dependencyKey: string | undefined): Part<S> {
    if (
      provider === undefined ||
      (!this.mergeAllOf && this.branchDepth === 0 && provider.node.conjunctionOf === undefined)
    ) {
      return part;
    }
    const members = this.graph.subschemas(provider.node.id, ALL_OF_KEY).flatMap(([, member]) => {
      const expanded = this.expand(member, provider.refPath, 'allOf', dependencyKey);
      return expanded === undefined ? [] : [scopedPart(expanded, `a${member}`)];
    });
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
    // An `allOf` a member still holds is one the policy left unmerged
    const nested = ownAllOf(schemas);
    const merged = this.mergeAll({
      ...withoutKeys(part.schema, ALL_OF_KEY),
      [ALL_OF_KEY]: schemas.slice(1).map((schema) => withoutKeys(schema, ALL_OF_KEY)),
    });
    if (nested.length > 0) {
      Reflect.set(merged, ALL_OF_KEY, nested);
    }
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
      return mergedAllOf(schema, this.context.customMergeAllOf);
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
    // A field with no data is checked as an empty object, a new one each time, which a validator filling defaults in
    // as it checks, as AJV's `useDefaults` does, may fill
    const holds = this.context.validator.isValid(condition, data ?? {}, this.graph.rawRoot);
    conditionMemo.setLatest(keys, [data], holds);
    return holds;
  }

  /** Applies the `then` or `else` the `if` chooses on the field's own data, `{}` standing in for none. Inside a
   * dependency, the `if` is checked against the data the dependency qualified on, and the branch's own `oneOf` is
   * applied, as the dependency's are.
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
    // A boolean `if` holds or fails whatever the data, which needs no validator to say, nor a precompiled one to have a
    // function for the schema it reads as
    const satisfied =
      conditionNode.kind === 'schema'
        ? this.holds(`if:${condition}`, conditionNode.raw, dependencyKey === undefined ? this.data : this.depData)
        : conditionNode.kind !== 'boolean' || conditionNode.value;
    const branchKey = satisfied ? THEN_KEY : ELSE_KEY;
    const branchProvider = keywords.get(branchKey);
    const branchNode = branchProvider && this.graph.child(branchProvider.node.id, branchKey);
    const branchPart = this.branch(branchProvider, branchKey, dependencyKey);
    return branchPart === undefined || branchNode === undefined
      ? without
      : mergeBranch(without, branchPart, 'b', branchNode);
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
      return this.expand(id, refPath, edge, dependencyKey);
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
          next = mergeBranch(next, dependent, 'b', dependency);
        }
      }
    }
    return next;
  }

  /** The subschema an option of a dependency's `oneOf` names its condition with: its `properties[key]`, read off the
   * option as written, or, for an option spelled as a `$ref`, off the schema it resolves to. That schema is planned
   * from the ref path the list was entered with, its recursive `$ref`s left unfollowed, since one leading back to the
   * schema declaring the dependency would otherwise read the same condition again without end
   */
  private dependencyCondition(option: NodeId, key: string, refPath: RefPath): unknown {
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
      cutRecursion: true,
    }).build([{ node: option, refPath }]);
    return getByPath(resolved.schema.properties, key);
  }

  /** Applies the one option of a dependency's `oneOf` whose `properties[key]` the data satisfies, less that property;
   * with no such option or several, none is applied. The list is chosen from rather than offered, so it is dropped
   * before the option is merged in, which keeps an `anyOf` or `oneOf` the option offers itself
   */
  private applyExactlyOne(part: Part<S>, key: string, provider: Provider<S> | undefined): Part<S> {
    if (provider === undefined) {
      return part;
    }
    const withoutList = { ...part, schema: withoutKeys(part.schema, ONE_OF_KEY) };
    const valid = this.graph
      .subschemas(provider.node.id, ONE_OF_KEY)
      .map(([, option]) => option)
      .filter((option) => {
        const condition = this.dependencyCondition(option, key, provider.refPath);
        if (!condition) {
          return false;
        }
        const conditionSchema = schemaFrom(this.graph.rawRoot, { type: 'object', properties: { [key]: condition } });
        return this.holds(`dependency:${option}:${key}`, conditionSchema, this.depData);
      });
    if (valid.length !== 1) {
      logOnce(`ignoring oneOf in dependencies of "${key}" because there isn't exactly one subschema that is valid`);
      return withoutList;
    }
    const chosen = this.expandBranch(valid[0], provider.refPath, 'dependency');
    if (chosen === undefined) {
      return withoutList;
    }
    const properties = { ...chosen.schema.properties };
    Reflect.deleteProperty(properties, key);
    const schema = { ...chosen.schema };
    Reflect.set(schema, PROPERTIES_KEY, properties);
    // A chain a nested dependency chose already drops the key its own option was chosen by, which stays dropped
    const chains = chosen.chains.map((chain) => {
      const declaring = chain.get(PROPERTIES_KEY);
      return declaring === undefined || declaring.drops !== undefined
        ? chain
        : new Map(chain).set(PROPERTIES_KEY, { ...declaring, drops: key });
    });
    return mergeBranch(withoutList, { schema, chains }, 'b', valid[0]);
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
    const option = selected === undefined ? undefined : this.expandOption(options[selected], optionRefPath);
    return option === undefined || selected === undefined ? part : mergeBranch(part, option, 'o', options[selected]);
  }

  private expandOption(id: NodeId, refPath: RefPath): Part<S> | undefined {
    const { optionPolicy } = this.policy;
    if (optionPolicy === undefined) {
      return this.expand(id, refPath, 'option');
    }
    const { mergeAllOf, conditions } = this;
    // The option is merged into the field, so an `if` of its own counts as the field's
    this.mergeAllOf =
      optionPolicy.allOf === true ||
      (optionPolicy.allOf === 'if' && (this.seedHasCondition || declaresKeyword(this.graph, id, IF_KEY)));
    this.conditions = optionPolicy.conditions;
    try {
      return this.expand(id, refPath, 'option');
    } finally {
      this.mergeAllOf = mergeAllOf;
      this.conditions = conditions;
    }
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
    return node.kind === 'schema' ? [ownProviders(node, refPath)] : [];
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
    optionPolicy: policy?.optionPolicy,
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
    resolved.optionPolicy?.allOf,
    resolved.optionPolicy?.conditions,
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

function seedOf<S extends StrictRJSFSchema>(node: NodeId, { refPath, scope }: Provider<S>): Seed {
  return scope === undefined ? { node, refPath } : { node, refPath, scope };
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
    return provider === undefined || node === undefined ? [] : [seedOf(node, provider)];
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
          .map(([, node]) => seedOf(node, provider));
  });
  const declared = seedsAt(seeding, PROPERTIES_KEY, key);
  if (declared.length > 0) {
    return { seeds: [...declared, ...patterns], edge: 'property', patterned: patterns.length > 0 };
  }
  return patterns.length > 0
    ? { seeds: patterns, edge: 'patternKey' }
    : { seeds: seedsAt(seeding, ADDITIONAL_PROPERTIES_KEY), edge: 'additionalKey' };
}
