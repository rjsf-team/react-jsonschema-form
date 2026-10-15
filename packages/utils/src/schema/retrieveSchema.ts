import { allowsAdditionalProperties, getAdditionalPropertySchema } from '../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  GUESSED_TYPE_FLAG,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  RJSF_REF_CYCLE_KEY,
  RJSF_REF_KEY,
  UNEVALUATED_PROPERTIES_KEY,
} from '../constants.ts';
import getSchemaOwnTypes from '../getSchemaOwnTypes.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import guessType from '../guessType.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import type {
  FormContextType,
  GenericObjectType,
  RJSFMarkedSchema,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  ValidatorType,
} from '../types.ts';
import { firstMatchingOption } from './getFirstMatchingOption.ts';
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
import type { AdoptedSchema, SchemaGraph } from './graph/parseSchemaGraph.ts';
import { childProvenance, extendChain, readProvenance, rootProvenance, stamp } from './graph/provenance.ts';
import type { GuardChain, Provenance } from './graph/provenance.ts';
import { childField, collapses, restartSeeds } from './graph/recursionRule.ts';
import type { ContainmentEdge, FieldPosition } from './graph/recursionRule.ts';
import { pointerTo, withVariantId } from './graph/validationTargets.ts';

/** Retrieves the schema of one field: the `schema` with its own `$ref`, `allOf`, `if`/`then`/`else`, `dependencies`
 * and patterns merged in for the `rawFormData`, and the extra keys of that data stubbed among its `properties`. The
 * schema is resolved one level at a time: a `$ref` under `properties`, `items` or an option is handed out as it stands,
 * for the caller to retrieve when it renders that subschema.
 *
 * Every subschema handed out carries where it came from, so retrieving it resolves it as the field it is. A recursive
 * `$ref` under `properties` is handed out flagged with `RJSF_REF_CYCLE_KEY`; `expandRefCycle()` expands such a field by
 * one level. Retrieving a schema this function returned gives the same schema back, and a schema
 * that carries nothing of the kind is resolved as a field of its own, from the top.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which retrieving a schema is desired
 * @param [rootSchema={}] - The root schema that will be forwarded to all the APIs
 * @param [rawFormData] - The current formData, if any, to assist retrieving a schema
 * @param [resolveAnyOfOrOneOfRefs = false] - Optional flag indicating whether to resolve the `anyOf`/`oneOf` options
 *          too, each as `retrieveSchema()` resolves it
 * @param [selectedOption] - The index of the `anyOf`/`oneOf` option selected for the field, among the options of the
 *          keyword `getXxxOfKey()` reads. The extra keys of the data are then stubbed once for the field and that
 *          option together: a key the option declares is left to it, and any other key is described by both the
 *          field's and the option's extra-key keywords. Without it, the extra keys are stubbed for the field alone
 * @returns - The schema having its conditions, additional properties, references and dependencies resolved
 */
export default function retrieveSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema?: S,
  rawFormData?: T,
  resolveAnyOfOrOneOfRefs = false,
  selectedOption?: number,
): S {
  if (!isObject(schema)) {
    return schemaFrom(schema, {});
  }
  const graph = parseSchemaGraph<S>(rootSchema ?? schemaFrom(schema, {}));
  const leaf = leafViews.get(schema);
  if (leaf?.graph === graph && isSchemaObject<S>(leaf.view)) {
    return leaf.view;
  }
  const view = buildView<S, F>(
    context,
    graph,
    fieldOf<S>(graph, schema),
    rawFormData,
    resolveAnyOfOrOneOfRefs,
    undefined,
    selectedOption,
  );
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
 * A copy of a handed-out schema, such as an option merged with what it inherits or a custom field's spread with a
 * keyword of its own, is planned from its own keywords, with the ref path and chain of the field it copies: restarting
 * the ref path would let a field that copies its schema at every level recurse without end. Only `expandRefCycle()`
 * restarts them.
 */
export function fieldOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, schema: S): Provenance<S> {
  const stamped = readProvenance<S>(schema, graph);
  if (stamped === undefined) {
    const adopted = graph.adopt(schema);
    return rootProvenance(adopted.graph, [{ node: adopted.node, refPath: [] }]);
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
 * two resources is a node in each
 */
function optionNode<S extends StrictRJSFSchema>(
  plan: MergePlan<S>,
  keyword: string,
  index: number,
  option: S,
): NodeId | undefined {
  const provided = seedsAt(plan, keyword, String(index)).find((seed) => {
    const node = plan.graph.node(seed.node);
    return node.kind === 'schema' && node.raw === option;
  });
  return provided?.node ?? plan.graph.byObject(option);
}

/** Returns the expansion of a field `retrieveSchema()` collapsed, flagging it with `RJSF_REF_CYCLE_KEY`: the field
 * resolved one level further, its seeds' ref paths and the guard chain its children are checked against restarted at
 * it, so its children collapse again at their next recurrence. The form expands the field at a path the user expanded
 * with this. A schema `retrieveSchema()` did not hand out is returned without the flag, as the call root it is.
 *
 * @param schema - The collapsed field's schema, as `retrieveSchema()` handed it out
 * @param rootSchema - The root schema it was handed out for
 * @returns - The schema to retrieve the expanded field from
 */
export function expandRefCycle<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootSchema: S): S {
  const stamped = readProvenance<S>(schema, parseSchemaGraph<S>(rootSchema));
  const expanded = withoutKeys(schema, RJSF_REF_CYCLE_KEY);
  return stamped === undefined
    ? expanded
    : handOut(expanded, childProvenance(stamped, { seeds: restartSeeds(stamped.seeds) }));
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
 * `rootSchema`, which the validator resolves against the root it is handed, or, for a schema with no place there, the
 * schema itself under an `$id` derived from its own, see `withVariantId()`, which a validator reads a `$ref` that is
 * only a fragment against the root under, as it reads every one it is handed. A schema `retrieveSchema()` handed out
 * from one subschema stands for it, so it is checked as JSON Schema reads that subschema rather than as the form merged
 * it; one merged from several is checked as merged.
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

/** The schemas `resolveOwnRef()` made, by graph and the schema holding the reference */
const ownRefs = new KeyedMemo<object>();

/** Returns a schema's own `$ref` resolved and marked with it, as a schema an option's `$ref` stands for is scored and
 * validated: the definition overridden by the keywords beside the reference where those only annotate, and otherwise
 * the `allOf` of them and of the definition merged, as the form reads it, so that scoring, constant options and the
 * `ui:definitions` walk read the keywords of both sides. The reference is resolved through the schema graph, from where
 * the schema sits in the root, as the form resolves it. Only that reference is followed: the validator follows those
 * below it against the root schema. The result is made once per schema and shared, so that a memo keyed on it hits
 * across calls, and a caller copies it rather than changing it.
 *
 * @param schema - The schema whose own `$ref` is to be resolved
 * @param rootSchema - The root schema the reference names a definition of
 * @returns - The schema with its own reference resolved, or the schema itself when it holds none
 * @throws - An error for a reference that resolves to nothing or a chain of references that loops
 */
export function resolveOwnRef<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootSchema: S): S {
  const ref = schema[REF_KEY];
  if (typeof ref !== 'string') {
    return schema;
  }
  const rootGraph = parseSchemaGraph<S>(rootSchema);
  const keys = [rootGraph, schema];
  const known = ownRefs.peek(keys);
  if (isSchemaObject<S>(known)) {
    return known;
  }
  const { graph, seeds } = fieldOf<S>(rootGraph, schema);
  // A stub merged from several declarations names the `$ref` of one of them, which is resolved from that one's node
  const declaring = seeds.find(({ node }) => {
    const seed = graph.node(node);
    return seed.kind === 'schema' && seed.raw[REF_KEY] === ref;
  });
  /* v8 ignore next -- a schema no seed declares the `$ref` of is adopted as a node of its own, which declares it */
  const id = (declaring ?? seeds[0]).node;
  const definition = refDefinition<S>(graph, id);
  const siblings = withoutKeys(schema, REF_KEY);
  const resolved: S =
    conjunctionOf<S>(graph, id) === undefined
      ? { ...definition, ...siblings, [RJSF_REF_KEY]: ref }
      : { ...conjoinDefinition(schema, siblings, definition), [RJSF_REF_KEY]: ref };
  ownRefs.set(keys, resolved);
  return resolved;
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
  selectedOption?: number,
): S {
  const { graph, seeds } = field;
  const policy = renderPolicy(context.validator, root);
  const planOf = (seedsToPlan: readonly Seed[], dataToPlan: unknown) =>
    buildPlan({ context, graph, seeds: seedsToPlan, data: dataToPlan, policy });
  const plan = planned ?? planOf(seeds, data);
  const viewKey = [field, plan, resolveOptions, data === undefined, selectedOption];
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
          const node =
            isSchemaObject<S>(option) && !isDecided(option) ? optionNode(plan, keyword, index, option) : undefined;
          if (node === undefined) {
            return option;
          }
          const provenance = childProvenance(field, {
            seeds: [{ node, refPath: [] }],
            chain: optionChain,
            optionOf: { setKey: plan.setKey, set: plan.set },
          });
          return resolveOptions
            ? buildView(context, root, provenance, data, false)
            : stubOf(graph.rawRoot, option, provenance);
        }),
      );
    }
  }
  const xxxOfKey = getXxxOfKey<S>(merged);
  const options: unknown[] = (xxxOfKey ? merged[xxxOfKey] : undefined) ?? [];
  const selected = selectedOption === undefined ? undefined : options[selectedOption];
  let option: S | undefined;
  if (isSchemaObject<S>(selected)) {
    option = retrieveSchema<unknown, S, F>(context, selected, graph.rawRoot, data);
  } else if (selected !== undefined) {
    option = schemaFrom(graph.rawRoot, selected ? {} : { not: {} });
  }
  // An option's own extra keys are stubbed with the field offering it, which knows which option is selected
  const fieldSchema = option === undefined ? merged : withOptionExtraKeys<S>(merged, option);
  const stubsExtraKeys = field.optionOf === undefined && allowsAdditionalProperties<S>(fieldSchema);
  const view = handOut(
    stubsExtraKeys
      ? stubExistingAdditionalProperties<unknown, S, F>(context, fieldSchema, graph.rawRoot, data, option?.properties)
      : fieldSchema,
    field,
  );
  // A view whose own plan read the data, or whose options or extra keys were resolved for it, holds for that data alone
  if (!plan.readsData && !resolveOptions && !stubsExtraKeys) {
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
 * type between them, say nothing here: choosing one is what would settle it. A schema whose options say nothing is
 * read through its `allOf` entries, the first of them to name a type answering for the merge.
 *
 * The schema is read as it stands: a `$ref` is not followed. `retrieveSchema()` with `resolveAnyOfOrOneOfRefs` resolves
 * a subschema and its options, which is how the form reads a key's subschema before asking this.
 *
 * @param subSchema - The schema describing the additional property, from `additionalProperties`, a matching pattern or
 *          `unevaluatedProperties`
 * @returns - The type the `subSchema` says the property holds, or undefined when only its value can say
 */
export function getAdditionalPropertyType<S extends StrictRJSFSchema = RJSFSchema>(subSchema: S): string | undefined {
  const ownTypes = getSchemaOwnTypes<S>(subSchema);
  if (ownTypes) {
    return ownTypes.find((ownType) => ownType !== 'null') ?? ownTypes[0];
  }
  const xxxOf = getXxxOfOptions<S>(subSchema);
  if (xxxOf) {
    const optionTypes = new Set(
      xxxOf.options.map((option) => (isObject(option) ? getAdditionalPropertyType<S>(option) : undefined)),
    );
    const [onlyType] = optionTypes;
    if (optionTypes.size === 1 && onlyType !== undefined) {
      return onlyType;
    }
  }
  const entries: unknown[] = Array.isArray(subSchema[ALL_OF_KEY]) ? subSchema[ALL_OF_KEY] : [];
  for (const entry of entries) {
    const entryType = isSchemaObject<S>(entry) ? getAdditionalPropertyType<S>(entry) : undefined;
    if (entryType !== undefined) {
      return entryType;
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
 * @param subSchema - The schema describing the additional property, from `additionalProperties`, a matching pattern or
 *          `unevaluatedProperties`
 * @param formData - The form data held by the additional property
 * @param typeOf - Reads the type the subschema names, its options resolved
 * @returns - The stub schema for the additional property
 */
function stubSchemaForSubSchema<S extends StrictRJSFSchema = RJSFSchema>(
  subSchema: S,
  formData: unknown,
  typeOf: (subSchema: S) => string | undefined,
): S {
  if (subSchema.type !== undefined) {
    return { ...subSchema };
  }
  const type = typeOf(subSchema);
  const offersOptions = getXxxOfOptions<S>(subSchema) !== undefined;
  if (type === undefined) {
    return offersOptions ? { ...subSchema } : guessedTypeSchema<S>(formData, subSchema);
  }
  return { ...(offersOptions ? subSchema : stubbableSchema<S>(subSchema)), type };
}

/** Returns the subschema a key has to meet under both `own` and `other`, which each describe it, allow it (`true`
 * or `undefined`) or forbid it (`false`)
 */
function conjoin(own: unknown, other: unknown): unknown {
  if (own === undefined || own === true) {
    return other ?? own;
  }
  if (other === undefined || other === true) {
    return own;
  }
  return own === false || other === false ? false : { [ALL_OF_KEY]: [own, other] };
}

/** Returns `schema` with the extra-key keywords of the `option` selected beside it joined to its own, which is how the
 * field the two render one property set for describes the keys neither declares: `additionalProperties` and
 * `unevaluatedProperties` become the `allOf` of the two, one side's where the other declares none or allows any key,
 * and `false` where either is, and the option's `patternProperties` join the schema's, a pattern both declare
 * becoming the `allOf` of its two subschemas
 *
 * @param schema - The object schema
 * @param option - The option selected beside it
 * @returns - The schema with the option's extra-key keywords joined to its own
 */
function withOptionExtraKeys<S extends StrictRJSFSchema = RJSFSchema>(schema: S, option: S): S {
  const joined: GenericObjectType = { ...schema };
  for (const keyword of [ADDITIONAL_PROPERTIES_KEY, UNEVALUATED_PROPERTIES_KEY]) {
    const value = conjoin(Reflect.get(schema, keyword), Reflect.get(option, keyword));
    if (value !== undefined) {
      joined[keyword] = value;
    }
  }
  const optionPatterns = option.patternProperties;
  if (optionPatterns !== undefined) {
    const patterns: GenericObjectType = { ...schema.patternProperties };
    for (const [pattern, subSchema] of Object.entries(optionPatterns)) {
      patterns[pattern] = conjoin(patterns[pattern], subSchema);
    }
    joined[PATTERN_PROPERTIES_KEY] = patterns;
  }
  return schemaFrom(schema, joined);
}

/** Stubs each key of `aFormData` that neither the schema's `properties` nor the `optionProperties` of the option
 * selected beside it declare among the schema's `properties`, flagged with `ADDITIONAL_PROPERTY_FLAG`. A key the option
 * declares is left to the option, which renders it. Any other key is described by the schema's extra-key keywords: a
 * key they forbid is stubbed as `{ type: 'null' }`, a `$ref` or an `allOf` is resolved before the stub is built, and a
 * subschema naming no type is given the one `getAdditionalPropertyType()` reads out of it, its options resolved, or
 * else the type of the data the key holds.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param theSchema - The schema for which the existing additional properties is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [aFormData] - The current formData, if any, to assist retrieving a schema
 * @param [optionProperties] - The `properties` of the option selected beside the schema, retrieved for the data
 * @returns - The updated schema with additional properties stubbed
 */
export function stubExistingAdditionalProperties<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, theSchema: S, rootSchema?: S, aFormData?: T, optionProperties: object = {}): S {
  // Clone the schema so that we don't ruin the consumer's original
  const schema = {
    ...theSchema,
    properties: { ...theSchema.properties },
  };
  const formData: GenericObjectType = aFormData && isObject(aFormData) ? aFormData : {};
  // `Object.hasOwn`, since `in` answers for the names on `Object.prototype` too, and a property called `constructor`
  // or `toString` left unstubbed is a value with no field to edit or remove it with
  const extraKeys = Object.keys(formData).filter(
    (key) => !Object.hasOwn(schema.properties, key) && !Object.hasOwn(optionProperties, key),
  );
  // Shared by every key stubbed here, since the keys no pattern matches are all described by the one subschema
  const namedTypes = new Map<S, string | undefined>();
  const typeOf = (subSchema: S) => {
    if (!namedTypes.has(subSchema)) {
      namedTypes.set(
        subSchema,
        getAdditionalPropertyType<S>(retrieveSchema<T, S, F>(context, subSchema, rootSchema, undefined, true)),
      );
    }
    return namedTypes.get(subSchema);
  };
  for (const key of extraKeys) {
    const keySchema = getAdditionalPropertySchema<S>(schema, key);
    let stub: S;
    if (keySchema === false) {
      // The schema forbids the key, so the property has no subschema of its own to render it with and no value the
      // schema allows
      stub = { type: 'null' } as S;
    } else if (isObject(keySchema)) {
      // A `$ref` and an `allOf` describe the property through other schemas, so they are resolved into the one schema
      // they describe before it is stubbed. A subschema that describes the property itself is stubbed as it stands,
      // and `SchemaField` resolves the stub again to render it
      const described =
        REF_KEY in keySchema || Array.isArray(keySchema[ALL_OF_KEY])
          ? retrieveSchema<T, S, F>(context, keySchema, rootSchema, formData[key])
          : keySchema;
      stub = stubSchemaForSubSchema<S>(described, formData[key], typeOf);
    } else {
      // A `true`: anything goes, so the property gets a field for the data it holds
      stub = guessedTypeSchema<S>(formData[key]);
    }
    (stub as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG] = true;
    // `defineProperty`, since assigning a key called `__proto__` runs the setter `Object.prototype` carries: it would
    // re-point this clone's prototype at the stub and declare no property, leaving the value with no field at all
    Object.defineProperty(schema.properties, key, {
      value: stub,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }
  return schema;
}
