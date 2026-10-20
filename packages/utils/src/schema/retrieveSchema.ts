import {
  additionalPropertiesKeyword,
  allowsAdditionalProperties,
  getAdditionalPropertySchema,
} from '../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  GUESSED_TYPE_FLAG,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  RJSF_REF_CYCLE_KEY,
  RJSF_REF_KEY,
  THEN_KEY,
  UNEVALUATED_PROPERTIES_KEY,
} from '../constants.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getSchemaOwnTypes from '../getSchemaOwnTypes.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import guessType from '../guessType.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import setOwn from '../setOwn.ts';
import type {
  CustomMergeAllOf,
  FormContextType,
  GenericObjectType,
  RJSFMarkedSchema,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  ValidatorType,
} from '../types.ts';
import { firstMatchingOption, optionNodeOf } from './getFirstMatchingOption.ts';
import { markHandedOut, isHandedOut } from './graph/handedOut.ts';
import KeyedMemo from './graph/keyedMemo.ts';
import buildPlan, {
  cachedPolicy,
  childSeeds,
  conjoinDefinition,
  conjunctionOf,
  refDefinition,
  schemaFrom,
  seedsAt,
  tupleSeeds,
  withoutKeys,
} from './graph/mergePlan.ts';
import type { MergePlan, OptionRequest, PlanPolicy, Seed } from './graph/mergePlan.ts';
import parseSchemaGraph from './graph/parseSchemaGraph.ts';
import type { AdoptedSchema, NodeId, SchemaGraph } from './graph/parseSchemaGraph.ts';
import { childProvenance, extendChain, readProvenance, rootProvenance, stamp } from './graph/provenance.ts';
import type { GuardChain, Provenance } from './graph/provenance.ts';
import { childField, collapses, ownRefTargets, restartSeeds } from './graph/recursionRule.ts';
import type { ContainmentEdge, FieldPosition } from './graph/recursionRule.ts';
import { dependencyCondition, pointerTo, withVariantId } from './graph/validationTargets.ts';

/** Retrieves the schema of one field: the `schema` with its own `$ref`, `allOf`, `if`/`then`/`else`, `dependencies`
 * and patterns merged in for the `rawFormData`, and the extra keys of that data stubbed among its `properties`. The
 * schema is resolved one level at a time: a `$ref` under `properties`, `items` or an option is handed out as it stands,
 * for the caller to retrieve when it renders that subschema.
 *
 * Every subschema handed out carries where it came from, so retrieving it resolves it as the field it is. A recursive
 * `$ref` under `properties` is handed out flagged with `RJSF_REF_CYCLE_KEY`; retrieving a copy with that flag set to
 * `false` expands it by one level. Retrieving a schema this function returned gives the same schema back, and a schema
 * that carries nothing of the kind is resolved as a field of its own, from the top.
 *
 * A `schema` the root does not hold is parsed once per content and kept for as long as the root, so one built from form
 * data keeps an entry for each distinct value until the root changes. Like the root, it must not be changed once handed
 * in: calls handed the same content share its result.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param [rootSchema={}] - The root schema that will be forwarded to all the APIs
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema
 * @param [resolveAnyOfOrOneOfRefs = false] - Optional flag indicating whether to resolve the `anyOf`/`oneOf` options
 *          too, each as `retrieveSchema()` resolves it
 * @returns - The schema having its conditions, additional properties, references and dependencies resolved
 */
export default function retrieveSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, schema: S, rootSchema?: S, rawFormData?: T, resolveAnyOfOrOneOfRefs = false): S {
  if (!isObject(schema)) {
    return schemaFrom(schema, {});
  }
  const graph = parseSchemaGraph<S>(rootSchema ?? schemaFrom(schema, {}));
  const leaf = leafViews.get(schema);
  if (leaf?.graph === graph && isSchemaObject<S>(leaf.view)) {
    return leaf.view;
  }
  const view = buildView<S, F>(context, graph, fieldOf<S>(graph, schema), rawFormData, resolveAnyOfOrOneOfRefs);
  if (isLeaf(graph, schema)) {
    leafViews.set(schema, { graph, view });
  }
  return view;
}

/** The views of the schemas that merge nothing and hold no subschemas, by schema: a call root, or a subschema
 * `retrieveSchema()` handed out for a field that merges nothing. Such a view reads neither the data nor the context, and
 * `isSelect()` and `sanitizeDataForNewSchema()` retrieve every property of a form on every edit, so it is retrieved
 * once per root rather than planned again on each call.
 */
const leafViews = new WeakMap<object, { readonly graph: object; readonly view: object }>();

/** The keywords that merge a subschema in, hand one out, or stub the extra keys of the data */
const NON_LEAF_KEYWORDS: readonly string[] = [
  REF_KEY,
  ALL_OF_KEY,
  IF_KEY,
  DEPENDENCIES_KEY,
  ANY_OF_KEY,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  PATTERN_PROPERTIES_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  UNEVALUATED_PROPERTIES_KEY,
  ITEMS_KEY,
  'prefixItems',
  'additionalItems',
];

/** Whether `schema` merges nothing and holds no subschemas, so that what it resolves to depends on nothing but itself
 *
 * @param schema - The schema to check
 * @returns - True when the schema holds none of the keywords that merge a subschema in, hand one out or stub the extra
 *          keys of the data
 */
export function isLeafSchema(schema: object): boolean {
  return !NON_LEAF_KEYWORDS.some((keyword) => Object.hasOwn(schema, keyword));
}

/** Whether `schema` is a leaf whose view depends on nothing but `schema`: a call root, or a subschema handed out as it
 * stands for a field that merges nothing. A copy a caller made of a handed-out subschema is planned from its own
 * keywords, so it is not one.
 */
function isLeaf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, schema: S): boolean {
  if (!isLeafSchema(schema)) {
    return false;
  }
  const stamped = readProvenance<S>(schema, graph);
  return stamped === undefined || (isHandedOut(schema) && mergesNothing(stamped.graph, stamped.seeds));
}

const OPTION_KEYWORDS: readonly ('anyOf' | 'oneOf')[] = [ANY_OF_KEY, ONE_OF_KEY];

function handOut<S extends StrictRJSFSchema>(schema: S, provenance: Provenance<S>): S {
  const stamped = stamp(schema, provenance);
  markHandedOut(stamped);
  return stamped;
}

/** The subschema last handed out for a field as it stands, by the field's provenance */
const stubs = new WeakMap<object, { readonly value: unknown; readonly stub: object }>();

/** Returns `value`, the subschema of the field `provenance` describes, handed out as it stands. It depends on nothing
 * else, so the same object is handed out again while the field's subschema is the same, which spares the deep
 * comparison that would otherwise find a new copy equal on every render of its parent.
 */
function stubOf<S extends StrictRJSFSchema>(rawRoot: S, value: unknown, provenance: Provenance<S>): S {
  const cached = stubs.get(provenance);
  if (cached !== undefined && cached.value === value && isSchemaObject<S>(cached.stub)) {
    return cached.stub;
  }
  const stub = handOut(schemaFrom(rawRoot, value), provenance);
  stubs.set(provenance, { value, stub });
  return stub;
}

/** A view, with the checks that say whether it still holds for other data: one per property whose own plan read its
 * data
 */
interface MemoizedView {
  readonly view: object;
  readonly holds: readonly ((data: unknown) => boolean)[];
}

/** The views that read the data only through some of its keys, by field, plan, whether options are resolved and
 * whether there is data: an object field's data is a new object on every edit, so such a view is reused while each
 * property that read its data would be handed out as before. A property handed out as it stands depends on its data
 * only through whether it collapses, which is checked again against the data, so a caller that mutates that data in
 * place gets an answer for what the data holds now. A property its patterns are merged into belongs to an object that
 * stubs its extra keys, whose view is not memoized.
 */
const views = new KeyedMemo<MemoizedView>();

/** Whether a field seeded by `seeds` merges nothing into its one subschema: a field that does, through a `$ref`, an
 * `allOf`, a condition, `dependencies` or options, is the only kind the recursion rule can collapse
 */
function mergesNothing<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, seeds: readonly Seed[]): boolean {
  const node = seeds.length === 1 ? graph.node(seeds[0].node) : undefined;
  return (
    node?.kind === 'schema' &&
    node.ref === undefined &&
    [ALL_OF_KEY, IF_KEY, DEPENDENCIES_KEY, ANY_OF_KEY, ONE_OF_KEY].every((keyword) => !Object.hasOwn(node.raw, keyword))
  );
}

/** Returns the field `schema` is the schema of. An unstamped schema, or one stamped for another root, is a call root.
 * A copy with `RJSF_REF_CYCLE_KEY` set to `false` is the expansion of the collapsed field it copies: its seeds restart,
 * and so does the guard chain its children are checked against. Any other copy of a handed-out schema, such as an
 * option merged with what it inherits or a custom field's spread with a keyword of its own, is planned from its own
 * keywords, with the ref path and chain of the field it copies: restarting the ref path would let a field that copies
 * its schema at every level recurse without end.
 *
 * @param graph - The graph of the current root
 * @param schema - The schema whose field is wanted
 * @returns - The provenance of the field
 */
export function fieldOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, schema: S): Provenance<S> {
  const stamped = readProvenance<S>(schema, graph);
  if (stamped === undefined) {
    const adopted = graph.adopt(schema);
    return rootProvenance(adopted.graph, [{ node: adopted.node, refPath: [] }]);
  }
  if (Reflect.get(schema, RJSF_REF_CYCLE_KEY) === false) {
    return childProvenance(stamped, { seeds: restartSeeds(stamped.seeds) });
  }
  if (isHandedOut(schema)) {
    return stamped;
  }
  const adopted = stamped.graph.adoptCopy(schema, stamped, stamped.seeds[0].node);
  return childProvenance(
    stamped,
    { seeds: [{ node: adopted.node, refPath: stamped.seeds[0].refPath }], chain: stamped.chain },
    adopted.graph,
  );
}

/** The node of the option `option` a plan's merged `keyword` list holds at `index`: the one a chain providing the list
 * holds there, which is the one parsed under the base of the resource that provider is in, since one object reached in
 * two resources is a node in each. An option no node holds, such as one of the cross product a merge makes of two
 * lists, is adopted, so that it is still handed out as an option of the field offering it, keeping the field's guard
 * chain: handed out as a schema of its own, a recursion through it would start afresh at every level. The merge makes
 * such an option anew for every plan, which the graph adopts once for what it holds.
 */
function optionNode<S extends StrictRJSFSchema>(
  plan: MergePlan<S>,
  keyword: string,
  index: number,
  option: S,
): AdoptedSchema<S> {
  const provided = seedsAt(plan, keyword, String(index)).find((seed) => {
    const node = plan.graph.node(seed.node);
    return node.kind === 'schema' && node.raw === option;
  });
  const node = provided?.node ?? plan.graph.byObject(option);
  return node === undefined ? plan.graph.adopt(option) : { graph: plan.graph, node };
}

/** The policy views are planned with: every `allOf` is merged, and an option only where the schema offering it has
 * `dependencies`, the one case resolution merges the option the data matches rather than leaving the choice to
 * `MultiSchemaField`
 */
function renderPolicy<S extends StrictRJSFSchema, F extends FormContextType>(
  validator: ValidatorType<S, F>,
  graph: SchemaGraph<S>,
): PlanPolicy<S> {
  return cachedPolicy<S>(validator, graph, 'render', () => ({
    allOf: true,
    selectOption: (request) => dependencyOption(validator, request, request.data),
  }));
}

/** Returns the option of a list beside `dependencies` that `data` matches first, which is merged into the schema
 * rather than left to `MultiSchemaField` to choose; none for any other list
 *
 * @param validator - The validator the options are matched with
 * @param request - The option list the plan met
 * @param data - The data the option is matched against
 * @returns - The index of the matching option, or undefined
 */
export function dependencyOption<S extends StrictRJSFSchema, F extends FormContextType>(
  validator: ValidatorType<S, F>,
  { graph, options, dependencies, discriminator }: OptionRequest<S>,
  data: unknown,
): number | undefined {
  if (!dependencies || options.length === 0) {
    return undefined;
  }
  return firstMatchingOption<S, F>(
    { validator },
    data,
    options.map((node) => ({ graph, node })),
    discriminator,
  );
}

/** Returns the node `schema` stands for: the subschema of `rootSchema` it is, or the field `retrieveSchema()` handed it
 * out as, or, for a schema with no place in the root, the schema itself, parsed beside the root
 *
 * @param schema - The schema
 * @param rootSchema - The root schema
 * @returns - The node and the graph holding it
 */
export function nodeOfSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootSchema: S): AdoptedSchema<S> {
  const graph = parseSchemaGraph<S>(rootSchema);
  const stamped = readProvenance<S>(schema, graph);
  if (stamped !== undefined && isHandedOut(schema) && stamped.seeds.length === 1) {
    return { graph: stamped.graph, node: stamped.seeds[0].node };
  }
  return graph.adopt(schema);
}

/** Returns the schema a validator checks `schema` with as the subschema it stands for: a `{ $ref }` naming its place in
 * `rootSchema`, see `pointerTo()`, which the validator resolves against the root it is handed, or, for a schema with no
 * place there, the schema itself under an `$id` derived from its own, see `withVariantId()`, which a validator reads a
 * `$ref` that is only a fragment against the root under, as it reads every one it is handed. A schema
 * `retrieveSchema()` handed out from one subschema stands for it, so it is checked as JSON Schema reads that subschema
 * rather than as the form merged it; one merged from several is checked as merged.
 *
 * @param schema - The schema to check data against
 * @param rootSchema - The root schema it belongs to
 * @returns - The schema to hand the validator
 */
export function getValidationTarget<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootSchema: S): S {
  const { graph, node } = nodeOfSchema<S>(schema, rootSchema);
  return pointerTo<S>(graph, node) ?? withVariantId<S>(schema);
}

/** Returns whether `data` satisfies the `if` `condition`: a schema one is checked as `getValidationTarget()` names it,
 * and a boolean one holds whatever it says
 *
 * @param context - The `SchemaContext` whose `validator` checks the condition
 * @param condition - What the `if` holds
 * @param data - The data the condition is checked against
 * @param rootSchema - The root schema the condition belongs to
 * @returns - Whether the condition holds
 */
export function conditionHolds<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  condition: unknown,
  data: unknown,
  rootSchema: S,
): boolean {
  return isSchemaObject<S>(condition)
    ? context.validator.isValid(getValidationTarget<S>(condition, rootSchema), data, rootSchema)
    : Boolean(condition);
}

/** Returns the node of `schema` that declares its own `$ref`, and the graph it is a node of
 *
 * @param rootGraph - The graph of the root schema
 * @param schema - A schema holding the `$ref`
 * @param ref - Its `$ref`
 * @returns - The graph and the id of the node declaring the `$ref`
 */
function ownRefNode<S extends StrictRJSFSchema>(rootGraph: SchemaGraph<S>, schema: S, ref: string) {
  const { graph, seeds } = fieldOf<S>(rootGraph, schema);
  // A stub merged from several declarations names the `$ref` of one of them, which is resolved from that one's node
  /* v8 ignore next -- a schema no seed declares the `$ref` of is adopted as a node of its own, which declares it */
  return { graph, id: (declaringSeed(graph, seeds, ref) ?? seeds[0]).node };
}

/** A schema's own `$ref` resolved, as `resolveOwnRef()` returns it, with the subschema the reference names */
export interface ResolvedOwnRef<S extends StrictRJSFSchema = RJSFSchema> {
  /** The schema with its own `$ref` resolved, or the schema itself when it holds none */
  readonly resolved: S;
  /** The subschema the `$ref` names, as the root holds it: the same object for every reference to it, from the root or
   * from a schema adopted beside it, which is how option scoring counts a definition once. Undefined for a schema
   * with no `$ref` or one naming a boolean.
   */
  readonly target: object | undefined;
}

/** A schema's own `$ref` as `findOwnRef()` finds it: resolved, or, for a reference that resolves to nothing or a chain
 * of references that loops, the `error` `resolveOwnRef()` throws for it
 */
export type OwnRef<S extends StrictRJSFSchema = RJSFSchema> = ResolvedOwnRef<S> | { readonly error: string };

/** The references `findOwnRef()` resolved, by graph, `customMergeAllOf` and the schema holding the reference, and
 * those `resolveMergedOwnRef()` resolved, by graph, `customMergeAllOf`, the node declaring the reference and the schema
 * holding it
 */
const ownRefs = new KeyedMemo<ResolvedOwnRef<StrictRJSFSchema>>();

/** Returns a schema's own `$ref` resolved and marked with it, as a schema an option's `$ref` stands for is scored and
 * validated: the definition overridden by the keywords beside the reference where those only annotate, and otherwise
 * the `allOf` of them and of the definition merged, as the form reads it, by the `customMergeAllOf` the form renders
 * with, so that scoring, constant options and the `ui:definitions` walk read the keywords of both sides as the field
 * renders them. The reference is resolved through the schema graph, from where the schema sits in the root, as the form
 * resolves it. Only that reference is followed: the validator follows those below it against the root schema. The
 * result is made once per schema and merge, and shared, so that a memo keyed on it hits across calls, and a caller
 * copies it rather than changing it.
 *
 * A reference that resolves to nothing, or a chain of references that loops, is answered with the error resolving it
 * throws rather than thrown, for a reader such as option scoring, to which such an `allOf` entry says nothing.
 *
 * @param schema - The schema whose own `$ref` is to be resolved
 * @param rootSchema - The root schema the reference names a definition of
 * @param [customMergeAllOf] - The merge of the context the form renders with, if it has one
 * @returns - The schema with its own reference resolved and the subschema it names, or the error for a reference
 *          that cannot be resolved
 */
export function findOwnRef<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S,
  customMergeAllOf?: CustomMergeAllOf<S>,
): OwnRef<S> {
  const ref = schema[REF_KEY];
  if (typeof ref !== 'string') {
    return { resolved: schema, target: undefined };
  }
  const rootGraph = parseSchemaGraph<S>(rootSchema);
  const keys = [rootGraph, customMergeAllOf, schema];
  const known = ownRefs.peek(keys);
  if (known !== undefined && isSchemaObject<S>(known.resolved)) {
    return { resolved: known.resolved, target: known.target };
  }
  const { graph, id } = ownRefNode<S>(rootGraph, schema, ref);
  const found = ownRefAt<S>(graph, id, schema, ref, customMergeAllOf);
  if (!('error' in found)) {
    ownRefs.set(keys, found);
  }
  return found;
}

/** Returns the own `$ref` `ref` of `schema` resolved from the node `id` declaring it, as `findOwnRef()` answers it */
function ownRefAt<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  id: NodeId,
  schema: S,
  ref: string,
  customMergeAllOf: CustomMergeAllOf<S> | undefined,
): OwnRef<S> {
  const node = graph.node(id);
  /* v8 ignore next -- the node declares the `$ref`, so it is a schema node holding the node the `$ref` resolves to */
  const target = node.kind === 'schema' && node.ref !== undefined ? graph.node(node.ref) : undefined;
  // The graph points a `$ref` whose chain ends at nothing or loops at an invalid node, which every resolution of the
  // reference would throw on
  if (target?.kind === 'invalid') {
    return { error: target.message };
  }
  const definition = refDefinition<S>(graph, id, customMergeAllOf);
  const siblings = withoutKeys(schema, REF_KEY);
  const resolved: S =
    conjunctionOf<S>(graph, id) === undefined
      ? { ...definition, ...siblings, [RJSF_REF_KEY]: ref }
      : { ...conjoinDefinition(schema, siblings, definition, customMergeAllOf), [RJSF_REF_KEY]: ref };
  return { resolved, target: target?.kind === 'schema' ? target.raw : undefined };
}

/** Returns a schema's own `$ref` as `findOwnRef()` resolves it, throwing for one it cannot resolve
 *
 * @param schema - The schema whose own `$ref` is to be resolved
 * @param rootSchema - The root schema the reference names a definition of
 * @param [customMergeAllOf] - The merge of the context the form renders with, if it has one
 * @returns - The schema with its own reference resolved and the subschema it names
 * @throws - An error for a reference that resolves to nothing or a chain of references that loops
 */
export function requireOwnRef<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S,
  customMergeAllOf?: CustomMergeAllOf<S>,
): ResolvedOwnRef<S> {
  return required<S>(findOwnRef<S>(schema, rootSchema, customMergeAllOf));
}

/** Returns a resolved own `$ref`, throwing the error of one that cannot be resolved */
function required<S extends StrictRJSFSchema>(own: OwnRef<S>): ResolvedOwnRef<S> {
  if ('error' in own) {
    throw new Error(own.error);
  }
  return own;
}

/** Returns a schema's own `$ref` resolved and marked with it, as `findOwnRef()` resolves it
 *
 * @param schema - The schema whose own `$ref` is to be resolved
 * @param rootSchema - The root schema the reference names a definition of
 * @param [customMergeAllOf] - The merge of the context the form renders with, if it has one
 * @returns - The schema with its own reference resolved, or the schema itself when it holds none
 * @throws - An error for a reference that resolves to nothing or a chain of references that loops
 */
export function resolveOwnRef<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S,
  customMergeAllOf?: CustomMergeAllOf<S>,
): S {
  return requireOwnRef<S>(schema, rootSchema, customMergeAllOf).resolved;
}

/** Returns whether the own `$ref` of `schema` names a definition under `rootSchema`, so that `resolveOwnRef()` resolves
 * it rather than throwing: a schema written for another root can hold a reference that names nothing under this one
 *
 * @param schema - The schema whose own `$ref` is looked up
 * @param rootSchema - The root schema the reference is looked up in
 * @returns - False for a reference that resolves to nothing or a chain of references that loops, and true otherwise
 */
export function ownRefResolves<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootSchema: S): boolean {
  return !('error' in findOwnRef<S>(schema, rootSchema));
}

/** Returns the own `$ref` of `schema`, a schema merged from the subschemas `seeds` seed, resolved as `resolveOwnRef()`
 * resolves it, from the seed declaring it. The merge is an object no graph holds, which `resolveOwnRef()` would read as
 * a call root, its `$ref` resolved against the root, where one written in a resource of its own resolves against that
 * resource. A `$ref` none of the seeds declares is resolved as `resolveOwnRef()` resolves it.
 *
 * @param graph - The graph holding the seeds
 * @param seeds - The seeds of the field `schema` is the merged schema of
 * @param schema - The merged schema whose own `$ref` is to be resolved
 * @param [customMergeAllOf] - The merge of the context the form renders with, if it has one
 * @returns - The schema with its own reference resolved, or the schema itself when it holds none
 * @throws - An error for a reference that resolves to nothing or a chain of references that loops
 */
export function resolveMergedOwnRef<S extends StrictRJSFSchema = RJSFSchema>(
  graph: SchemaGraph<S>,
  seeds: readonly Seed[],
  schema: S,
  customMergeAllOf?: CustomMergeAllOf<S>,
): S {
  const ref = schema[REF_KEY];
  if (typeof ref !== 'string') {
    return schema;
  }
  const declaring = declaringSeed(graph, seeds, ref);
  if (declaring === undefined) {
    return resolveOwnRef<S>(schema, graph.rawRoot, customMergeAllOf);
  }
  const keys = [graph, customMergeAllOf, declaring.node, schema];
  const known = ownRefs.peek(keys);
  if (known !== undefined && isSchemaObject<S>(known.resolved)) {
    return known.resolved;
  }
  const found = required<S>(ownRefAt<S>(graph, declaring.node, schema, ref, customMergeAllOf));
  ownRefs.set(keys, found);
  return found.resolved;
}

/** The seed declaring `ref`, the own `$ref` of a schema merged from several declarations */
function declaringSeed<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  seeds: readonly Seed[],
  ref: string,
): Seed | undefined {
  return seeds.find(({ node }) => {
    const seed = graph.node(node);
    return seed.kind === 'schema' && seed.raw[REF_KEY] === ref;
  });
}

/** Whether an option's plan adds nothing to the plan of the field offering it, beyond the option's own `$ref` */
function addsNothing<S extends StrictRJSFSchema>(
  plan: MergePlan<S>,
  field: Provenance<S>,
  offered: ReadonlySet<NodeId>,
): boolean {
  const [seed] = field.seeds;
  const seedNode = field.graph.node(seed.node);
  return [...plan.set].every(
    (node) => offered.has(node) || (node === seed.node && seedNode.kind === 'schema' && seedNode.pureRef),
  );
}

function valueOf(data: unknown, key: string): unknown {
  return isObject(data) && Object.hasOwn(data, key) ? data[key] : undefined;
}

function buildView<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  root: SchemaGraph<S>,
  field: Provenance<S>,
  data: unknown,
  resolveOptions: boolean,
  planned?: MergePlan<S>,
): S {
  const { graph, seeds } = field;
  const policy = renderPolicy(context.validator, root);
  const planOf = (seedsToPlan: readonly Seed[], dataToPlan: unknown) =>
    buildPlan({ context, graph, seeds: seedsToPlan, data: dataToPlan, policy });
  const plan = planned ?? planOf(seeds, data);
  const viewKey = [field, plan, resolveOptions, data === undefined];
  const memoized = views.peek(viewKey);
  if (memoized?.holds.every((holds) => holds(data)) && isSchemaObject<S>(memoized.view)) {
    return memoized.view;
  }
  const holds: ((dataToCheck: unknown) => boolean)[] = [];
  const seedNode = graph.node(seeds[0].node);
  if (field.optionOf !== undefined && seedNode.kind === 'schema' && addsNothing(plan, field, field.optionOf.set)) {
    // An option such as a `$ref` back to the schema offering it: merged in, it would render that schema again inside
    // itself, without end
    return handOut(withoutKeys(seedNode.raw, REF_KEY), field);
  }
  const merged = withoutKeys(plan.schema, RJSF_REF_CYCLE_KEY);
  // An option merged in is the one the data matches, so the choice it was is not offered again, unless the option
  // declares options of its own, and an empty list beside `dependencies` offers no choice to merge one from
  for (const { keyword, list, options, dependencies, selected } of plan.choices) {
    if (list === merged[keyword] && (selected !== undefined || (dependencies && options.length === 0))) {
      Reflect.deleteProperty(merged, keyword);
    }
  }
  let extended: GuardChain | undefined;
  const extendedChain = () => {
    extended ??= extendChain(graph, field.chain, plan.setKey);
    return extended;
  };
  const child = (seedsOfChild: readonly Seed[], edge: ContainmentEdge, inData: boolean) => {
    const next = childField(extendedChain, { seeds: seedsOfChild, edge, inData });
    return {
      next,
      provenance: childProvenance(field, { seeds: next.seeds, chain: next.chain }),
    };
  };
  // A subschema already handed out was decided where it was handed out, and a stub for an extra key is a field of its
  // own
  const isDecided = (value: object) =>
    readProvenance(value, root) !== undefined || Boolean(Reflect.get(value, ADDITIONAL_PROPERTY_FLAG));
  const { properties } = merged;
  if (PROPERTIES_KEY in merged && !isObject(properties)) {
    // `properties` that holds no subschemas declares none
    Reflect.set(merged, PROPERTIES_KEY, {});
  } else if (isObject(properties)) {
    const entries = Object.entries(properties).map(([key, value]): [string, unknown] => {
      if (isObject(value) && isDecided(value)) {
        return [key, value];
      }
      const found = childSeeds(plan, key);
      if (found.edge !== 'property') {
        return [key, value];
      }
      // A property its patterns are merged into is not the subschema it was declared as, so it is handed out merged
      const { seeds: propertySeeds, edge, patterned } = found;
      if (!patterned && !isSchemaObject<S>(value)) {
        return [key, value];
      }
      if (!patterned && mergesNothing(graph, propertySeeds)) {
        return [key, stubOf(graph.rawRoot, value, child(propertySeeds, edge, false).provenance)];
      }
      const { next, provenance } = child(propertySeeds, edge, isObject(data) && Object.hasOwn(data, key));
      const own = valueOf(data, key);
      const childPlan = planOf(next.seeds, own);
      const position: FieldPosition = { edge, view: 'render', dataDriven: next.dataDriven, chain: next.chain };
      const collapsed = collapses(graph, childPlan, position);
      if (childPlan.readsData) {
        holds.push(
          (dataToCheck) => collapses(graph, planOf(next.seeds, valueOf(dataToCheck, key)), position) === collapsed,
        );
      }
      if (collapsed) {
        // A boolean property collapses as the empty schema it stands for
        const shown = isSchemaObject<S>(value) ? value : schemaFrom(graph.rawRoot, {});
        return [key, handOut({ ...shown, [RJSF_REF_CYCLE_KEY]: true }, provenance)];
      }
      return [
        key,
        patterned
          ? buildView(context, root, provenance, own, false, childPlan)
          : stubOf(graph.rawRoot, value, provenance),
      ];
    });
    Reflect.set(merged, PROPERTIES_KEY, Object.fromEntries(entries));
  }
  const item = (value: unknown, seedsOfItem: readonly Seed[], edge: ContainmentEdge) =>
    seedsOfItem.length === 0 || !isSchemaObject<S>(value) || isDecided(value)
      ? value
      : stubOf(graph.rawRoot, value, child(seedsOfItem, edge, true).provenance);
  const tuple = (entries: unknown[]) =>
    entries.map((entry, index) => item(entry, tupleSeeds(plan, index), 'tupleItem'));
  // A view drops the row keywords that hold nothing, rather than holding them as undefined
  const setRows = (keyword: 'items' | 'additionalItems', value: unknown) => {
    if (value === undefined) {
      Reflect.deleteProperty(merged, keyword);
    } else {
      Reflect.set(merged, keyword, value);
    }
  };
  const { items, additionalItems } = merged;
  setRows(ITEMS_KEY, Array.isArray(items) ? tuple(items) : item(items, seedsAt(plan, ITEMS_KEY), 'item'));
  const prefixItems: unknown = Reflect.get(merged, 'prefixItems');
  if (Array.isArray(prefixItems)) {
    Reflect.set(merged, 'prefixItems', tuple(prefixItems));
  }
  setRows('additionalItems', item(additionalItems, seedsAt(plan, 'additionalItems'), 'item'));
  for (const keyword of OPTION_KEYWORDS) {
    const options = merged[keyword];
    if (Array.isArray(options)) {
      // `MultiSchemaField` renders the option as a schema of its own, so its ref path restarts. Where the field has
      // data, the option restarts the guard chain too, as a row or key the data holds does: the data bounds how often
      // that happens, and an option the user picks for a recursive field renders its own options rather than collapsing
      const optionChain = data === undefined ? extendedChain() : undefined;
      Reflect.set(
        merged,
        keyword,
        options.map((option, index) => {
          if (!isSchemaObject<S>(option) || isDecided(option)) {
            return option;
          }
          const adopted = optionNode(plan, keyword, index, option);
          const provenance = childProvenance(
            field,
            {
              seeds: [{ node: adopted.node, refPath: [] }],
              chain: optionChain,
              optionOf: { setKey: plan.setKey, set: plan.set },
            },
            adopted.graph,
          );
          return resolveOptions
            ? buildView(context, root, provenance, data, false)
            : stubOf(graph.rawRoot, option, provenance);
        }),
      );
    }
  }
  const stubsExtraKeys = allowsAdditionalProperties<S>(merged);
  const view = handOut(
    stubsExtraKeys ? stubExistingAdditionalProperties<unknown, S, F>(context, merged, graph.rawRoot, data) : merged,
    field,
  );
  const resolvedOptions = resolveOptions && OPTION_KEYWORDS.some((keyword) => Array.isArray(merged[keyword]));
  // A view whose own plan read the data, or whose options or extra keys were resolved for it, holds for that data alone
  if (!plan.readsData && !resolvedOptions && !stubsExtraKeys) {
    views.set(viewKey, { view, holds });
  }
  return view;
}

/** Returns the type an additional property described by `subSchema` holds, or `undefined` for a schema that leaves the
 * type to the value the property comes to hold. It is what `retrieveSchema()` stubs such a property with and what
 * `ObjectField` seeds a new one from, so the value the add button writes is one the field it renders can show.
 *
 * The types come from `getSchemaOwnTypes()`, so a schema that names its type says that one, a nullable `['integer',
 * 'null']` resolves to the type a value of it can have, a typeless `enum` takes the type of its values — where
 * `getSchemaType()` answers `string` for any of them, giving an `enum` of numbers a string it rejects — and a schema
 * that only implies its type, `properties` implying `object`, says what every other reader of it renders it as. The
 * non-`null` type comes first, as it does for a nullable type: a value of it is one the field can show, where `null`
 * leaves the user nothing to enter.
 *
 * An `anyOf`/`oneOf` of options that agree on a type has that type whichever option is chosen, each option read by
 * this same function so that an option's own typeless `enum` speaks for it too. Options that disagree, or that name no
 * type between them, say nothing here: choosing one is what would settle it, and a type one of them names alone would
 * render a field for that type beside the options.
 *
 * A schema that says nothing about the type itself is read through the subschemas merged into it — the `allOf` entries
 * it is composed of and the `$ref` it is spelled as, given a `rootSchema` to look the definition up in — since
 * composition is how a schema usually names the object or the enum it is. The options are no exception: one of them
 * naming a type is the option's answer, where a merged subschema's is the whole schema's, so a subschema whose options
 * say nothing is still read through the `allOf` and the `$ref` beside them. The first of those to name a type answers,
 * the merge holding the value to every entry at once. They are looked up rather than the schema resolved: the type is all
 * that is wanted here, where resolving every option of every additional property would cost each render the merges
 * `MultiSchemaField` already pays for the one option on screen. A reference followed once on a walk is not followed
 * again, since a recursive option refers back to itself without end, and one naming no definition says nothing, as the
 * option holding it does until it is resolved.
 *
 * @param subSchema - The schema describing the additional property, from `additionalProperties`, a matching pattern or
 *          `unevaluatedProperties`
 * @param [rootSchema] - The root schema a `$ref` names a definition of, when there is one to look it up in
 * @returns - The type the `subSchema` says the property holds, or undefined when only its value can say
 */
export function getAdditionalPropertyType<S extends StrictRJSFSchema = RJSFSchema>(
  subSchema: S,
  rootSchema?: S,
): string | undefined {
  return additionalPropertyType<S>(subSchema, rootSchema, new Set<NodeId>());
}

/** Returns the definition a `schema` is spelled as a `$ref` to, as far as one can be named without resolving the
 * schema. It is how a subschema says what it is without saying it in keywords of its own, and the lookup is what lets a
 * reader that only asks a question about the subschema -- what type it holds, what names it declares -- ask it of the
 * schema the reference names. The reference is resolved through the schema graph from where the schema sits in the
 * root, as the form resolves it.
 *
 * The definition is read as resolution reads it beside the referring schema's own keywords. Keywords that constrain
 * the data beside a `$ref` are read with the definition as the `allOf` of both, so the whole definition is read and
 * the names both declare count. Where the keywords beside the `$ref` are annotations only, they replace the
 * definition's, so only the keywords the referring schema leaves to it are read off the definition: a shadowed one
 * describes nothing the form renders, so counting the names it declares would leave a key with no field at all.
 *
 * @param schema - The schema whose reference is to be looked up
 * @param rootSchema - The root schema the reference names a definition of, when there is one to look it up in
 * @param followed - The definitions already read on this walk, which the one `schema` names is added to
 * @param [customMergeAllOf] - The merge of the context the form renders with, if it has one
 * @returns - The definition the reference names, less any keywords the referring schema shadows, or undefined where
 *          there is none to name or it was followed already
 */
function referencedDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  rootSchema: S | undefined,
  followed: Set<NodeId>,
  customMergeAllOf?: CustomMergeAllOf<S>,
): S | undefined {
  if (rootSchema === undefined || schema[REF_KEY] === undefined) {
    return undefined;
  }
  const { graph, seeds } = fieldOf<S>(parseSchemaGraph<S>(rootSchema), schema);
  const [{ node }] = seeds;
  const target = ownRefTargets(graph, node).at(-1);
  // Keyed on the definition rather than the schema naming it, so a walk reads each definition once along a path, however
  // many references lead to it: by the referring schema, a graph of definitions offering one another is read along
  // every trail through it, which grows exponentially with the definitions
  if (target === undefined || graph.node(target).kind === 'boolean' || followed.has(target)) {
    return undefined;
  }
  followed.add(target);
  try {
    const definition = refDefinition<S>(graph, node, customMergeAllOf);
    return conjunctionOf<S>(graph, node) === undefined ? withoutKeys(definition, ...Object.keys(schema)) : definition;
  } catch {
    // A reference that names no definition says nothing about the property, as the subschema holding it does until it
    // is resolved: whatever resolves that subschema to render it reports the broken reference on its own
    return undefined;
  }
}

/** Reads the type for `getAdditionalPropertyType()`, carrying the references followed so far across the options and the
 * definitions the walk reaches.
 *
 * @param subSchema - The schema describing the additional property
 * @param rootSchema - The root schema a `$ref` names a definition of, when there is one to look it up in
 * @param followedRefs - The references already followed on this walk
 * @returns - The type the `subSchema` says the property holds, or undefined when only its value can say
 */
function additionalPropertyType<S extends StrictRJSFSchema = RJSFSchema>(
  subSchema: S,
  rootSchema: S | undefined,
  followedRefs: Set<NodeId>,
): string | undefined {
  const ownTypes = getSchemaOwnTypes<S>(subSchema);
  if (ownTypes) {
    return ownTypes.find((ownType) => ownType !== 'null') ?? ownTypes[0];
  }
  const xxxOf = getXxxOfOptions<S>(subSchema);
  if (xxxOf) {
    // Each option follows the references this walk has followed without adding to the others' lists, so two options
    // naming the same definition both read it rather than the second one reading a reference already followed
    const optionTypes = new Set(
      xxxOf.options.map((option) =>
        isObject(option) ? additionalPropertyType<S>(option, rootSchema, new Set(followedRefs)) : undefined,
      ),
    );
    const [onlyType] = optionTypes;
    if (optionTypes.size === 1 && onlyType !== undefined) {
      return onlyType;
    }
    // Options that say nothing between them leave the question to the subschemas merged in beside them, which
    // constrain the value whichever option is chosen, rather than answering `undefined` for the whole subschema
  }
  // The subschemas merged into this one say what the property holds as much as its own keywords do: an `allOf` entry
  // constrains the very same value, and a `$ref` is how a subschema usually names the object or the enum it is. The
  // first of them to name a type answers, since the merge holds the value to every one of them at once, so a type one
  // entry names is the type the whole merge has whatever the entries that name none add to it
  const merged: (S | boolean | undefined)[] = Array.isArray(subSchema[ALL_OF_KEY])
    ? [...(subSchema[ALL_OF_KEY] as (S | boolean)[])]
    : [];
  // The references followed to reach this subschema, which each entry then follows without adding to the lists of the
  // entries beside it, as an option does: two entries naming the same definition both read it, where one that shadows
  // the definition's `type` would otherwise leave the type behind it unread
  const refs = new Set(followedRefs);
  merged.push(referencedDefinition<S>(subSchema, rootSchema, refs));
  for (const entry of merged.filter((candidate) => isObject(candidate))) {
    const mergedType = additionalPropertyType<S>(entry, rootSchema, new Set(refs));
    if (mergedType !== undefined) {
      return mergedType;
    }
  }
  return undefined;
}

/** The keywords that constrain a value of a given type without naming the type itself. A typeless `additionalProperties`
 * subschema carrying any of them constrains the property it describes, so the property is not free to hold any type.
 */
const VALUE_KEYWORDS: string[] = [
  'enum',
  'const',
  'format',
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'items',
  'prefixItems',
  'additionalItems',
  'contains',
  'minContains',
  'maxContains',
  'minItems',
  'maxItems',
  'uniqueItems',
  'properties',
  'patternProperties',
  'additionalProperties',
  'propertyNames',
  'required',
  'dependentRequired',
  'minProperties',
  'maxProperties',
];

/** The keywords that constrain a value by way of other subschemas. They assert something about the value as surely as
 * the `VALUE_KEYWORDS` do, but they are left out of the stub: an `allOf` naming a type of its own would contradict the
 * type the stub takes from the data and fail to merge on every render, and the validator enforces them either way.
 */
const SUBSCHEMA_KEYWORDS: string[] = [
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
  'dependencies',
  'dependentSchemas',
  'unevaluatedItems',
  'unevaluatedProperties',
  '$ref',
  '$dynamicRef',
  '$recursiveRef',
];

/** The keywords that identify a subschema rather than describe a value. The stub is built once per property, so
 * copying them would give every sibling property the same identifier — and an `$id` naming a registered field would
 * route them all to it.
 */
export const IDENTIFIER_KEYWORDS: string[] = ['$id', '$anchor', '$dynamicAnchor', '$schema', '$vocabulary'];

/** The keywords that hold other subschemas for a `$ref` to name rather than describe a value. The stub drops the
 * `$ref` that would reach them, so copying them into every property would hand each one an unreachable copy that
 * `hashForSchema()` and `deepEquals()` then walk on every render.
 */
export const CONTAINER_KEYWORDS: string[] = ['$defs', 'definitions'];

/** Every keyword that constrains the value, for the reasons the first two lists above give. They are only ever
 * consulted together, once per key a schema holds, so they are consulted as one.
 */
export const CONSTRAINING_KEYWORDS = new Set<string>([...VALUE_KEYWORDS, ...SUBSCHEMA_KEYWORDS]);

/** The keywords no stub carries, whatever the stub keeps of the rest, for the reasons the two lists above give: both
 * reasons are about building a stub once per property key, not about what the stub then says of the value.
 */
const UNSTUBBABLE_KEYWORDS = new Set<string>([...IDENTIFIER_KEYWORDS, ...CONTAINER_KEYWORDS]);

/** Every keyword a guessed-type stub leaves out, for the reasons the three lists above give. They are only ever
 * consulted together, and once per property key, so they are consulted as one.
 */
const EXCLUDED_STUB_KEYWORDS = new Set<string>([...SUBSCHEMA_KEYWORDS, ...UNSTUBBABLE_KEYWORDS]);

/** Returns the copy of `subSchema` that a stub stands for one property with, without the keywords that identify the
 * subschema or hold others rather than describe the value. It is for the stub whose type the subschema only implies,
 * which is the form's own reading of what that one property holds rather than the subschema as it was written: a field
 * registered under an `$id` is for the schema that carries it, and routing every sibling property to such a field for a
 * type the schema never named would be the form's doing, not the schema's.
 *
 * The copy is spread rather than rebuilt key by key so that the symbol markers a resolved schema carries survive,
 * `RJSF_REF_KEY` above all: `resolveUiSchema()` reads that marker off the stub to apply the `ui:definitions` entry of
 * the `$ref` the property was described through, which `Object.entries()` would cost the property by not enumerating
 * it.
 *
 * @param subSchema - The schema describing the additional property
 * @returns - The copy to build the stub from
 */
function stubbableSchema<S extends StrictRJSFSchema = RJSFSchema>(subSchema: S): S {
  const schema: GenericObjectType = { ...subSchema };
  UNSTUBBABLE_KEYWORDS.forEach((keyword) => delete schema[keyword]);
  return schema as S;
}

/** Builds the stub schema for an additional property whose own schema names no type, keeping what that schema says
 * about the value and giving it the type of the data the property currently holds, so that it renders as a field for
 * that data. Dropping the rest would cost the value its `enum`, `format` or range, leaving a field that neither
 * constrains the value the way the schema does nor offers the other types the schema might allow. The
 * `SUBSCHEMA_KEYWORDS`, `IDENTIFIER_KEYWORDS` and `CONTAINER_KEYWORDS` are not kept, and neither is a `default` of
 * another type than the data, which would re-seed a field of the data's type with a value it cannot hold.
 *
 * The stub is marked as guessed when the schema puts no constraint on the property at all, i.e. it is `true` or has
 * none of the `VALUE_KEYWORDS` or `SUBSCHEMA_KEYWORDS`. That marker tells the fallback UI the property is free to hold
 * any other type, so a schema that constrains the value must not carry it, or the UI would offer types that schema
 * rejects. Any other keyword — an annotation, an identifier, a container such as `$defs`, or one these lists do not
 * know — leaves the property unconstrained, so an unfamiliar keyword never locks the type in place.
 *
 * @param formData - The form data held by the additional property
 * @param [subSchema] - The `additionalProperties` schema describing the property, unless it is simply `true`
 * @returns - The stub schema for the additional property
 */
function guessedTypeSchema<S extends StrictRJSFSchema = RJSFSchema>(formData: unknown, subSchema: S = {} as S): S {
  const type = guessType(formData);
  const schema: GenericObjectType = { ...subSchema };
  let isConstrained = false;
  Object.entries(subSchema).forEach(([key, value]) => {
    if (CONSTRAINING_KEYWORDS.has(key)) {
      isConstrained = true;
    }
    const isForeignDefault = key === 'default' && guessType(value) !== type;
    if (EXCLUDED_STUB_KEYWORDS.has(key) || isForeignDefault) {
      delete schema[key];
    }
  });
  schema.type = type;
  if (!isConstrained) {
    (schema as RJSFMarkedSchema)[GUESSED_TYPE_FLAG] = true;
  }
  return schema as S;
}

/** Builds the stub for an additional property described by `subSchema`, whose `$ref`s are expected to be resolved
 * already. A schema naming its `type` is stubbed as it stands, so a nullable `['integer', 'null']` keeps both names for
 * the field that offers a choice between them, and so is one offering `anyOf`/`oneOf` options, since the option the
 * value matches is what renders it; options that agree on a type are given it, the way `ObjectField` seeds a new
 * property of this very schema with that type. A schema that neither names a type nor offers options is given the type
 * `getAdditionalPropertyType()` reads out of the keywords that imply one, and otherwise the type of the data the
 * property holds, keeping what it does say about the value, so the property renders as a field for that data rather
 * than one no type can render.
 *
 * A stub that stands for the subschema as its author wrote it keeps the keywords that identify it, as every other
 * reader of the subschema does, so a field registered under its `$id` renders the properties it describes: that is the
 * one naming its own type, and the one offering options, whose options this hands on for `MultiSchemaField` to choose
 * between whether or not they agree on a type to name beside them. `stubbableSchema()` strips the identifiers off the
 * stub left, the one the form gave the type that keywords describing the value only imply, for the reason given there,
 * as `guessedTypeSchema()` strips them off the one whose type is guessed from the data.
 *
 * The type is read once per subschema object, which is what `namedTypes` remembers it under: the walk of the options
 * and the lookup of each `$ref` among them reads nothing but the subschema and the root schema, where a key no pattern
 * matches hands this the object's one `additionalProperties` again for every key the data holds.
 *
 * @param subSchema - The schema describing the additional property, from `additionalProperties`, a matching pattern or
 *          `unevaluatedProperties`
 * @param formData - The form data held by the additional property
 * @param rootSchema - The root schema a `$ref` among the subschema's options names a definition of
 * @param namedTypes - The type each subschema stubbed so far was read as, keyed on the subschema itself
 * @returns - The stub schema for the additional property
 */
function stubSchemaForSubSchema<S extends StrictRJSFSchema = RJSFSchema>(
  subSchema: S,
  formData: unknown,
  rootSchema: S | undefined,
  namedTypes: Map<S, string | undefined>,
): S {
  if (subSchema.type !== undefined) {
    return { ...subSchema };
  }
  if (!namedTypes.has(subSchema)) {
    namedTypes.set(subSchema, getAdditionalPropertyType<S>(subSchema, rootSchema));
  }
  const type = namedTypes.get(subSchema);
  const offersOptions = getXxxOfOptions<S>(subSchema) !== undefined;
  if (type === undefined) {
    return offersOptions ? { ...subSchema } : guessedTypeSchema<S>(formData, subSchema);
  }
  return { ...(offersOptions ? subSchema : stubbableSchema<S>(subSchema)), type };
}

/** Returns the subschemas a `dependencies` entry merges into the schema it belongs to for the `formData` in hand,
 * which `declaredPropertyNames()` reads for the names they bring with them.
 *
 * A dependent schema's `oneOf` is not a choice `MultiSchemaField` offers: the merge plan settles it from the data
 * (`applyExactlyOne()` in `mergePlan.ts`), merging in the one branch whose own schema for the dependency key the data
 * matches, so the names that branch declares are rendered by whatever renders this schema. Read as options they would
 * be left to a selector that is never on screen, and a name only the matching branch declares would be stubbed beside
 * the field that branch renders it with. A branch is matched on the `dependencyCondition()` that function matches it
 * on, and nothing is merged where no single branch qualifies, which is the case it drops the `oneOf` in rather than
 * rendering any of it. The dependency itself is read behind the `$ref` it
 * may be spelled as for the same reason, since that is where its branches are then written. Without a `rootSchema` to
 * look a reference up in and match the branches against, none of them is read and the names they declare are left to be
 * stubbed, as the branches of an `if` are.
 *
 * @param context - The `SchemaContext` whose `validator` settles which branch the data matches
 * @param dependent - What the `dependencies` entry holds, which is a schema here and a list of required names elsewhere
 * @param dependencyKey - The name the entry is keyed under, which its branches name their condition on
 * @param rootSchema - The root schema the branches are matched against, when there is one
 * @param formData - The form data the object holds
 * @returns - The subschemas the entry merges in
 */
function dependencySubschemas<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  dependent: S | boolean,
  dependencyKey: string,
  rootSchema: S | undefined,
  formData: GenericObjectType,
): (S | boolean)[] {
  if (!isObject(dependent)) {
    return [dependent];
  }
  const ownOneOf = dependent[ONE_OF_KEY];
  // A dependency spelled as a `$ref` holds its `oneOf` behind that reference, and the merge plan follows that reference
  // before it takes the `oneOf` off, so the branch is settled from the data for that spelling too. Read
  // without following the reference it offers no branches, and a name the matching branch declares would be stubbed
  // beside the field that branch renders it with, which is what the inline spelling no longer does
  const referenced =
    ownOneOf === undefined
      ? referencedDefinition<S>(dependent, rootSchema, new Set<NodeId>(), context.customMergeAllOf)
      : undefined;
  const oneOf = ownOneOf ?? referenced?.[ONE_OF_KEY];
  if (!Array.isArray(oneOf)) {
    return [dependent];
  }
  // The rest of the dependency is read without those branches, which a dependency spelled as a `$ref` holds behind the
  // reference: read as options, a name every branch declares would count as one the form renders even where no
  // single branch qualifies and none of the `oneOf` is merged in. So the definition is read without its `oneOf`,
  // conjoined with the keywords the dependency declares beside its `$ref` as the form merges them, so that a
  // `properties` there adds its names to those the definition declares rather than replacing them
  const withoutOneOf =
    referenced === undefined
      ? withoutKeys(dependent, ONE_OF_KEY)
      : conjoinDefinition(
          dependent,
          withoutKeys(dependent, ONE_OF_KEY, REF_KEY),
          withoutKeys(referenced, ONE_OF_KEY),
          context.customMergeAllOf,
        );
  const matching =
    rootSchema === undefined
      ? []
      : (oneOf as (S | boolean)[]).filter((branch) => {
          if (!isObject(branch)) {
            return false;
          }
          const { graph, node } = nodeOfSchema<S>(branch, rootSchema);
          const condition = dependencyCondition(graph, node, dependencyKey);
          return condition !== undefined && context.validator.isValid(condition, formData, rootSchema);
        });
  return matching.length === 1 ? [withoutOneOf, matching[0]] : [withoutOneOf];
}

/** Returns the property names a `schema` declares, including the ones it declares through the `allOf` entries it is
 * composed of, the `$ref` it is spelled as, the branch its `if` settles for the `formData` and the `dependencies` that
 * data brings in — every subschema that is merged into it before it renders, so that each of them declares its names as
 * the schema's own.
 *
 * The condition is put to the validator, which is the question the merge plan asks to merge that branch in, so the
 * branch read here is the branch whose properties the form renders; a dependency is read on the same terms the merge
 * plan's `applyDependencies()` applies it on, which are that the data has the key and the schema declares it, so that
 * the names read here are the ones the merge is about to bring in. Without a `rootSchema` to resolve the condition
 * against, neither branch is read and the names it declares are left to be stubbed instead. A reference is looked up
 * rather than the schema resolved: the names are all that is wanted here, where resolving every option of every
 * expandable object would cost each render the merge `MultiSchemaField` already pays for the one option on screen.
 *
 * Each of those subschemas is read through `namesOptionRenders()`, so the names every one of its own `anyOf`/`oneOf`
 * options renders count as names the schema renders too: a `$ref` is how an option usually names the choice it is, and
 * a name behind that reference is no less the merged schema's than one it declares inline. That is also what answers
 * for a merged subschema that takes keys its own `properties` don't name, which declares no name in particular: the
 * merge gives the schema that keyword, so `retrieveSchema()` stubs every key the data holds for it and it renders
 * whatever key it is asked about. There is no list of names to answer with then, which is `undefined`, so an option
 * spelled as a `$ref` to a map is read as the map it is rather than as the names its definition happens to declare.
 * The schema's own keyword is left out of the question, since the object `stubExistingAdditionalProperties()` is
 * stubbing has one by definition.
 *
 * @param context - The `SchemaContext` whose `validator` settles a condition
 * @param schema - The schema whose declared names are desired
 * @param rootSchema - The root schema a reference names a definition of, when there is one to look it up in
 * @param formData - The form data the object holds, which its conditions and dependencies are evaluated against
 * @param followedRefs - The references already followed on this walk
 * @param matchedOptionOnly - Whether only the option its own data matches is read among an option's own options
 * @returns - The names the schema and the subschemas merged into it declare between them, or undefined when one of
 *          those subschemas takes every key the data holds
 */
function declaredPropertyNames<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S | undefined,
  formData: GenericObjectType,
  followedRefs: Set<NodeId>,
  matchedOptionOnly: boolean,
): string[] | undefined {
  const merged: (S | boolean | undefined)[] = Array.isArray(schema[ALL_OF_KEY])
    ? [...(schema[ALL_OF_KEY] as (S | boolean)[])]
    : [];
  // The references followed to reach this schema, which this walk adds its own to without adding to the lists of the
  // walks beside it
  const refs = new Set(followedRefs);
  merged.push(referencedDefinition<S>(schema, rootSchema, refs, context.customMergeAllOf));
  if (IF_KEY in schema && rootSchema !== undefined) {
    const holds = conditionHolds<S, F>(context, schema[IF_KEY], formData, rootSchema);
    merged.push((holds ? schema[THEN_KEY] : schema[ELSE_KEY]) as S | boolean | undefined);
  }
  const properties = schema[PROPERTIES_KEY];
  const dependencies = schema[DEPENDENCIES_KEY];
  if (isObject(dependencies)) {
    const applying = Object.entries(dependencies).filter(
      ([key]) => getByPath(formData, key) !== undefined && (!properties || Object.hasOwn(properties, key)),
    );
    for (const [key, dependent] of applying) {
      merged.push(...dependencySubschemas<S, F>(context, dependent as S | boolean, key, rootSchema, formData));
    }
  }
  const names = Object.keys(properties ?? {});
  for (const subSchema of merged.filter((entry) => isObject(entry))) {
    // Each merged subschema is read as `namesOptionRenders()` reads an option, so that one offering `anyOf`/`oneOf`
    // options of its own contributes the names every one of them renders: a `$ref` is how an option usually names the
    // choice it is, and a name behind that reference has the option's field as much as one declared inline does. It
    // follows the references reaching this schema without adding to the lists of the entries beside it, as an option
    // does, so two entries naming the same definition both read it: one that shadows the definition's `properties`
    // would otherwise leave the names behind it to be stubbed over the field the entry beside it renders them with
    const subNames = namesOptionRenders<S, F>(
      context,
      subSchema,
      rootSchema,
      formData,
      new Set(refs),
      matchedOptionOnly,
    );
    if (subNames === undefined) {
      return undefined;
    }
    names.push(...subNames);
  }
  return names;
}

/** Returns the names an `anyOf`/`oneOf` option renders as properties of its own once it is selected, which are the
 * names it declares and the ones every one of its own options does. An option that takes keys of its own names none of
 * them in particular: `retrieveSchema()` stubs every key the form data holds outside its `properties` for it, the way
 * it does for the object around it, so it renders whatever key it is asked about and this says so with `undefined`.
 * The option is read for that keyword through the subschemas merged into it as much as through its own, since a `$ref`
 * is how an option usually names the map it is.
 *
 * @param context - The `SchemaContext` whose `validator` settles a condition
 * @param option - The option whose rendered names are desired
 * @param rootSchema - The root schema a reference names a definition of, when there is one to look it up in
 * @param formData - The form data the object holds, which the option's conditions are evaluated against
 * @param followedRefs - The references already followed on this walk
 * @param matchedOptionOnly - Whether only the option the data matches is read among the option's own options
 * @returns - The names the option renders, or undefined for an option that renders every key the data holds
 */
function namesOptionRenders<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  option: S,
  rootSchema: S | undefined,
  formData: GenericObjectType,
  followedRefs: Set<NodeId>,
  matchedOptionOnly: boolean,
): Set<string> | undefined {
  if (allowsAdditionalProperties<S>(option)) {
    return undefined;
  }
  const nestedNames = namesTheOptionsRender<S, F>(
    context,
    option,
    rootSchema,
    formData,
    followedRefs,
    matchedOptionOnly,
  );
  if (nestedNames === undefined) {
    return undefined;
  }
  const declaredNames = declaredPropertyNames<S, F>(
    context,
    option,
    rootSchema,
    formData,
    followedRefs,
    matchedOptionOnly,
  );
  return declaredNames === undefined ? undefined : new Set([...declaredNames, ...nestedNames]);
}

/** Returns the names a `schema`'s `anyOf`/`oneOf` options render, which are either the names every one of them renders
 * or the names the one the data matches does, depending on what the keyword describing the object's extra keys makes of
 * a name the option on screen is the only one to render.
 *
 * Under `additionalProperties`, or a matching pattern, that keyword describes the key whichever option is chosen, so
 * only a name every option renders is left to them: the option on screen is the user's to choose and `retrieveSchema()`
 * leaves the options for `MultiSchemaField` to choose between rather than merging the chosen one in, so a name the
 * other options don't render would have no field at all under them and the value it holds nothing to edit or remove it
 * with. Under `unevaluatedProperties` the keyword says nothing about a key the matching option evaluates, which is
 * every key that option declares, so a stub for one of its names is not a second field for the value but the wrong
 * schema over it; a name only another option declares is a key nothing evaluates, which is the keyword's to describe
 * and the object's to stub, so only the matching option is read. That option is matched as option matching matches
 * everywhere, by where it sits in the root, so a precompiled validator has a function compiled for it.
 *
 * It is not always the option on screen. `MultiSchemaField` picks with `getClosestMatchingOption()`, which scores
 * rather than takes the first that validates, and it keeps a choice the user made in the dropdown, which is state
 * nothing here can read. Where the two disagree, a name the option on screen declares is stubbed beside the field
 * that option renders it with: which keys an option renders is a render-time fact, and this answers it from the
 * schema and the data alone.
 *
 * A schema offering no options renders no name this way, and one whose every option takes keys of its own renders every
 * key the data holds, which is `undefined` as it is for a single option.
 *
 * @param context - The `SchemaContext` whose `validator` settles a condition and matches an option
 * @param schema - The schema whose options are to be read
 * @param rootSchema - The root schema a reference names a definition of, when there is one to look it up in
 * @param formData - The form data the object holds, which an option's conditions are evaluated against and which the
 *          matching option is matched on
 * @param followedRefs - The references already followed on this walk
 * @param matchedOptionOnly - Whether only the option the data matches is read, rather than every option
 * @returns - The names the options render between them, or undefined when every one of them renders every key the data
 *          holds
 */
function namesTheOptionsRender<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S | undefined,
  formData: GenericObjectType,
  followedRefs: Set<NodeId>,
  matchedOptionOnly: boolean,
): Set<string> | undefined {
  const options = getXxxOfOptions<S>(schema)?.options ?? [];
  if (options.length === 0) {
    return new Set<string>();
  }
  const read =
    matchedOptionOnly && rootSchema !== undefined
      ? [matchingOption<S, F>(context, schema, options, rootSchema, formData)]
      : options;
  // Each option follows the references this walk has followed without adding to the others' lists, so two options
  // naming the same definition both read it rather than the second one reading a reference already followed
  const namesPerOption = read.map((option) =>
    isObject(option)
      ? namesOptionRenders<S, F>(context, option, rootSchema, formData, new Set(followedRefs), matchedOptionOnly)
      : new Set<string>(),
  );
  const naming = namesPerOption.filter((names): names is Set<string> => names !== undefined);
  if (naming.length === 0) {
    return undefined;
  }
  return naming.reduce((shared, names) => new Set([...shared].filter((name) => names.has(name))));
}

/** Returns the one of an object's `options` that the `formData` matches, which is the option `MultiSchemaField`
 * renders for that data and so the only one evaluating anything the object holds.
 *
 * @param context - The `SchemaContext` whose `validator` scores the options
 * @param schema - The object schema offering the options, read for the discriminator it names
 * @param options - The options to match the data against
 * @param rootSchema - The root schema a reference among the options names a definition of
 * @param formData - The form data the object holds
 * @returns - The option the data matches
 */
function matchingOption<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  options: S[],
  rootSchema: S,
  formData: GenericObjectType,
): S {
  const matched = firstMatchingOption<S, F>(
    context,
    formData,
    options.map((option) => optionNodeOf<S>(option, rootSchema)),
    getDiscriminatorFieldFromSchema<S>(schema),
  );
  return options[matched];
}

/** Returns the names another schema renders as properties of its own for an object that `retrieveSchema()` is stubbing
 * the extra keys of, so that a key one of them names is no more stubbed here than one the object's own `properties`
 * name: it would otherwise be given a field beside the one that schema renders for it, giving the one value two fields
 * to be written from, under one pair of ids.
 *
 * Those schemas are the ones merged into the object and the `anyOf`/`oneOf` options rendered beside it, which the
 * object's own `properties` are missing the names of for opposite reasons: a merge may be left undone, where an option
 * is left to `MultiSchemaField` to choose between on purpose.
 *
 * Which options count is settled once here, from the keyword the object describes its extra keys with:
 * `unevaluatedProperties` describes a key no subschema evaluates, which the matching option's own properties are not
 * and another option's are, where `additionalProperties` and a pattern describe the key whatever an option makes of
 * it, so every option counts and only a name all of them render is left to them. A key one of the object's patterns
 * also matches follows the object's answer rather than its own, the question being the object's to settle: leaving the
 * name to the option that evaluates it costs the value a field while another option is on screen, where stubbing it
 * writes a schema over a value the option describes.
 *
 * @param context - The `SchemaContext` whose `validator` settles a condition
 * @param schema - The object schema whose extra keys are being stubbed
 * @param rootSchema - The root schema a reference names a definition of, when there is one to look it up in
 * @param formData - The form data the object holds, which the conditions it reaches are evaluated against
 * @returns - The names rendered elsewhere, or undefined when every key the data holds is
 */
function namesRenderedElsewhere<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S | undefined,
  formData: GenericObjectType,
): Set<string> | undefined {
  // `unevaluatedProperties` is the keyword describing the extra keys only where there is no `additionalProperties` for
  // `additionalPropertiesKeyword()` to give precedence to, which is the one place that reads it
  const matchedOptionOnly =
    schema.additionalProperties === undefined && additionalPropertiesKeyword<S>(schema) !== undefined;
  const optionNames = namesTheOptionsRender<S, F>(
    context,
    schema,
    rootSchema,
    formData,
    new Set<NodeId>(),
    matchedOptionOnly,
  );
  if (optionNames === undefined) {
    return undefined;
  }
  // A subschema merged into this object that takes keys of its own is this object taking them, which is the case the
  // stub is for rather than one to leave to another schema, so the walk saying so names nothing rendered elsewhere
  const declaredNames =
    declaredPropertyNames<S, F>(context, schema, rootSchema, formData, new Set<NodeId>(), matchedOptionOnly) ?? [];
  return new Set([...declaredNames, ...optionNames]);
}

/** Creates new 'properties' items for each key in the `formData`
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param theSchema - The schema for which the existing additional properties is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [aFormData] - The current formData, if any, to assist retrieving a schema
 * @returns - The updated schema with additional properties stubbed
 */
export function stubExistingAdditionalProperties<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, theSchema: S, rootSchema?: S, aFormData?: T): S {
  // Clone the schema so that we don't ruin the consumer's original
  const schema = {
    ...theSchema,
    properties: { ...theSchema.properties },
  };

  // make sure formData is an object
  const formData: GenericObjectType = aFormData && isObject(aFormData) ? aFormData : {};
  // The keys to stub are the ones the schema has no property for. `Object.hasOwn`, since `in` answers for the names on
  // `Object.prototype` too, and a property called `constructor` or `toString` left unstubbed is a value with no field
  // to edit or remove it with
  const extraKeys = Object.keys(formData).filter((key) => !Object.hasOwn(schema.properties, key));
  if (extraKeys.length === 0) {
    return schema;
  }
  // Asked once, and only for an object whose data holds a key to ask it about: the walk of every option and the lookup
  // of every `$ref` among them is work an object with no such key never has a question to answer with
  const renderedElsewhere = namesRenderedElsewhere<S, F>(context, schema, rootSchema, formData);
  if (renderedElsewhere === undefined) {
    // A schema merged into this one, or an option rendered beside it, renders every key the data holds as a property
    // of its own
    return schema;
  }
  // A key one of those schemas renders is left to it: a stub would give the one value a second field to be written from
  const keysToStub = extraKeys.filter((key) => !renderedElsewhere.has(key));
  // Shared by every key stubbed here, since the keys no pattern matches are all described by the one subschema
  const namedTypes = new Map<S, string | undefined>();
  for (const key of keysToStub) {
    const keySchema = getAdditionalPropertySchema<S>(schema, key);
    let stub: S;
    if (keySchema === false) {
      // The schema forbids the key, so the property has no subschema of its own to render it with and no value the
      // schema allows
      stub = { type: 'null' } as S;
    } else if (isObject(keySchema)) {
      // A `$ref` and the `allOf` of the matching patterns describe the property through another schema, so they are
      // resolved into the one schema they describe before it is stubbed. Nothing else is: a subschema that describes the
      // property itself is stubbed as it stands, and `SchemaField` resolves the stub again to render it, so resolving
      // the whole of it here is work the property pays for twice
      const described =
        REF_KEY in keySchema || Array.isArray(keySchema[ALL_OF_KEY])
          ? retrieveSchema<T, S, F>(context, keySchema, rootSchema, formData[key])
          : keySchema;
      stub = stubSchemaForSubSchema<S>(described, formData[key], rootSchema, namedTypes);
    } else {
      // What is left is a `true`, or a keyword the schema leaves out, which JSON Schema reads as `true`: anything goes,
      // including a key none of the `patternProperties` patterns match, which the schema allows all the same and so
      // gets a field for the data it holds
      stub = guessedTypeSchema<S>(formData[key]);
    }
    // Set our additional property flag so we know it was dynamically added
    (stub as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
    setOwn(schema.properties, key, stub);
  }

  return schema;
}
