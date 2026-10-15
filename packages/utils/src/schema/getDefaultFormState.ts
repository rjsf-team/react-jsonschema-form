import { allowsAdditionalProperties } from '../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  IF_KEY,
  ONE_OF_KEY,
  UI_DEFINITIONS_KEY,
} from '../constants.ts';
import constIsAjvDataReference from '../constIsAjvDataReference.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getOptionUiSchema from '../getOptionUiSchema.ts';
import getPropertySchema from '../getPropertySchema.ts';
import getRenderedOptionSchema, { rendersOwnFieldBesideOption } from '../getRenderedOptionSchema.ts';
import getSchemaType from '../getSchemaType.ts';
import getSchemaTypeForValue from '../getSchemaTypeForValue.ts';
import getStaticItemsUiSchema from '../getStaticItemsUiSchema.ts';
import getUiOptions from '../getUiOptions.ts';
import { getFieldTypeForUiSchema } from '../getWidget.tsx';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import type { XxxOfOptions } from '../getXxxOfOptions.ts';
import isConstant from '../isConstant.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import isFixedItems from '../isFixedItems.ts';
import isObject from '../isObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import mergeDefaultsWithFormData from '../mergeDefaultsWithFormData.ts';
import mergeObjects from '../mergeObjects.ts';
import mergeSchemas from '../mergeSchemas.ts';
import optionsList from '../optionsList.ts';
import { getByPath } from '../pathUtils.ts';
import resolveUiSchema from '../resolveUiSchema.ts';
import toConstant from '../toConstant.ts';
import type {
  DefaultFormStateBehavior,
  FormContextType,
  GenericObjectType,
  GetDefaultFormStateProps,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  UiSchema,
  ValidatorType,
} from '../types.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import buildPlan, {
  asTarget,
  cachedPolicy,
  childSeeds,
  ownChildren,
  schemaFrom,
  seedsKey,
  withoutKeys,
} from './graph/mergePlan.ts';
import type { MergePlan, OptionChoice, PlanChildren, PlanEntry, PlanPolicy, Seed } from './graph/mergePlan.ts';
import parseSchemaGraph from './graph/parseSchemaGraph.ts';
import type { NodeId, SchemaGraph } from './graph/parseSchemaGraph.ts';
import { collapses, restartSeeds } from './graph/recursionRule.ts';
import type { ContainmentEdge } from './graph/recursionRule.ts';
import isMultiSelect from './isMultiSelect.ts';
import isSelect from './isSelect.ts';
import retrieveSchema, { dependencyOption, resolveOwnRef, stubExistingAdditionalProperties } from './retrieveSchema.ts';

const PRIMITIVE_TYPES = ['string', 'number', 'integer', 'boolean', 'null'];

/** Enum that indicates how `schema.additionalItems` should be handled by the `getInnerSchemaForArrayItem()` function.
 */
export const AdditionalItemsHandling = {
  Ignore: 0,
  Invert: 1,
  Fallback: 2,
} as const;
export type AdditionalItemsHandling = (typeof AdditionalItemsHandling)[keyof typeof AdditionalItemsHandling];

/** Determines whether a schema has an allOf key AND the defaultFormStateBehavior for all of is set
 * to `populateDefaults`.
 *
 * @params schema - The schema to check
 * @params defaultFormStateBehavior - The DefaultFormStateBehavior to check
 * @returns - True if allOf defaults should be populated, false otherwise.
 */
function shouldPopulateAllOfDefaults<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  defaultFormStateBehavior?: DefaultFormStateBehavior,
): boolean {
  return defaultFormStateBehavior?.allOf === 'populateDefaults' && ALL_OF_KEY in schema;
}

/** Given a `schema` will return an inner schema that for an array item. This is computed differently based on the
 * `additionalItems` enum and the value of `idx`. There are four possible returns:
 * 1. If `idx` is >= 0, then if `schema.items` is an array the `idx`th element of the array is returned if it is a valid
 *    index and not a boolean, otherwise it falls through to 3.
 * 2. If `schema.items` is not an array AND truthy and not a boolean, then `schema.items` is returned since it actually
 *    is a schema, otherwise it falls through to 3.
 * 3. If `additionalItems` is not `AdditionalItemsHandling.Ignore` and `schema.additionalItems` is an object, then
 *    `schema.additionalItems` is returned since it actually is a schema, otherwise it falls through to 4.
 * 4. {} is returned representing an empty schema
 *
 * @param schema - The schema from which to get the particular item
 * @param [additionalItems=AdditionalItemsHandling.Ignore] - How do we want to handle additional items?
 * @param [idx=-1] - Index, if non-negative, will be used to return the idx-th element in a `schema.items` array
 * @returns - The best fit schema object from the `schema` given the `additionalItems` and `idx` modifiers
 */
export function getInnerSchemaForArrayItem<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  additionalItems: AdditionalItemsHandling = AdditionalItemsHandling.Ignore,
  idx = -1,
): S {
  if (idx >= 0) {
    if (Array.isArray(schema.items) && idx < schema.items.length) {
      const item = schema.items[idx];
      if (typeof item !== 'boolean') {
        return item as S;
      }
    }
  } else if (schema.items && !Array.isArray(schema.items) && typeof schema.items !== 'boolean') {
    return schema.items as S;
  }
  if (additionalItems !== AdditionalItemsHandling.Ignore && isObject(schema.additionalItems)) {
    return schema.additionalItems as S;
  }
  return {} as S;
}

/** Determines whether `value` holds anything: a non-empty string or array, or an object with at least one own key.
 * Everything else — including numbers, booleans, `null` and `undefined` — has no content.
 *
 * @param value - The value to inspect
 * @returns - True if the value holds content, otherwise false
 */
function hasContent(value: unknown): boolean {
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0;
  }
  return false;
}

/** Checks if the given `schema` contains the `null` type along with another type AND if the `default` contained within
 * the schema is `null` AND the `computedDefault` is empty. If all of those conditions are true, then the `schema`'s
 * default should be `null` rather than `computedDefault`.
 *
 * @param schema - The schema to inspect
 * @param computedDefault - The computed default for the schema
 * @returns - Flag indicating whether a null should be returned instead of the computedDefault
 */
export function computeDefaultBasedOnSchemaTypeAndDefaults<T = unknown, S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  computedDefault: T,
) {
  const { default: schemaDefault, type } = schema;
  const shouldReturnNullAsDefault =
    Array.isArray(type) && type.includes('null') && !hasContent(computedDefault) && schemaDefault === null;
  return shouldReturnNullAsDefault ? (null as T) : computedDefault;
}

/** Either add `computedDefault` at `key` into `obj` or not add it based on its value, the value of
 * `includeUndefinedValues`, the value of `emptyObjectFields` and if its parent field is required. Generally undefined
 * `computedDefault` values are added only when `includeUndefinedValues` is either true/"excludeObjectChildren". If `
 * includeUndefinedValues` is false and `emptyObjectFields` is not "skipDefaults", then non-undefined and non-empty-object
 * values will be added based on certain conditions.
 *
 * @param acc - The object into which the computed default may be added
 * @param key - The key into the object at which the computed default may be added
 * @param computedDefault - The computed default value that maybe should be added to the obj
 * @param includeUndefinedValues - Optional flag, if true, cause undefined values to be added as defaults.
 *          If "excludeObjectChildren", cause undefined values for this object and pass `includeUndefinedValues` as
 *          false when computing defaults for any nested object properties. If "allowEmptyObject", prevents undefined
 *          values in this object while allow the object itself to be empty and passing `includeUndefinedValues` as
 *          false when computing defaults for any nested object properties.
 * @param isParentRequired - The optional boolean that indicates whether the parent field is required
 * @param requiredFields - The list of fields that are required
 * @param emptyObjectFields - How to treat an empty object field, stated by the caller rather than read off the
 *        context, since the `additionalProperties` pass deliberately does not apply the form's setting
 * @param isConst - Optional flag, if true, indicates that the schema has a const property defined, thus we should always return the computedDefault since it's coming from the const.
 * @param isNullType - The type of the schema is null
 */
function maybeAddDefaultToObject<T = unknown>(
  acc: GenericObjectType,
  key: string,
  computedDefault: T | T[] | undefined,
  includeUndefinedValues: boolean | 'excludeObjectChildren',
  isParentRequired?: boolean,
  requiredFields: string[] = [],
  emptyObjectFields: NonNullable<DefaultFormStateBehavior['emptyObjectFields']> = 'populateAllDefaults',
  isConst = false,
  isNullType = false,
) {
  if (includeUndefinedValues === true || isConst) {
    // If includeUndefinedValues is explicitly true
    // Or if the schema has a const property defined, then we should always return the computedDefault since it's coming from the const.
    acc[key] = computedDefault;
  } else if (includeUndefinedValues === 'excludeObjectChildren') {
    // Fix for Issue #4709: When in 'excludeObjectChildren' mode, don't set primitive fields to empty objects
    // Only add the computed default if it's not an empty object placeholder for a primitive field
    if (
      (isNullType && computedDefault !== undefined) ||
      !isObject(computedDefault) ||
      Object.keys(computedDefault).length > 0
    ) {
      acc[key] = computedDefault;
    }
    // If computedDefault is an empty object {}, don't add it - let the field stay undefined
  } else if (emptyObjectFields !== 'skipDefaults') {
    // If isParentRequired is undefined, then we are at the root level of the schema so defer to the requiredness of
    // the field key itself in the `requiredField` list
    const isSelfOrParentRequired = isParentRequired ?? requiredFields.includes(key);

    if (isObject(computedDefault)) {
      // If emptyObjectFields 'skipEmptyDefaults' store computedDefault if it's a non-empty object(e.g. not {})
      if (emptyObjectFields === 'skipEmptyDefaults') {
        if (Object.keys(computedDefault).length > 0) {
          acc[key] = computedDefault;
        }
      } // Else store computedDefault if it's a non-empty object(e.g. not {}) and satisfies certain conditions
      // Condition 1: If computedDefault is not empty or if the key is a required field
      // Condition 2: If the parent object is required or emptyObjectFields is not 'populateRequiredDefaults'
      else if (
        (Object.keys(computedDefault).length > 0 || requiredFields.includes(key)) &&
        (isSelfOrParentRequired || emptyObjectFields !== 'populateRequiredDefaults')
      ) {
        acc[key] = computedDefault;
      }
    } else if (
      // Store computedDefault if it's a defined primitive (e.g., true) and satisfies certain conditions
      // Condition 1: computedDefault is not undefined
      // Condition 2: If emptyObjectFields is 'populateAllDefaults' or 'skipEmptyDefaults)
      // Or if isSelfOrParentRequired is 'true' and the key is a required field
      computedDefault !== undefined &&
      (emptyObjectFields === 'populateAllDefaults' ||
        emptyObjectFields === 'skipEmptyDefaults' ||
        (isSelfOrParentRequired && requiredFields.includes(key)))
    ) {
      acc[key] = computedDefault;
    }
  }
}

// The forwarded props are inherited rather than restated, so the two shapes cannot drift apart as options are added.
// `schema` and `formData` are omitted because the recursion takes them as its own positional `rawSchema` and
// `rawFormData`
interface ComputeDefaultsProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends Omit<GetDefaultFormStateProps<T, S, F>, 'schema' | 'formData'> {
  /** Any defaults provided by the parent field in the schema */
  parentDefaults?: T;
  /** The current formData, if any, onto which to provide any missing defaults */
  rawFormData?: T;
  /** Optional flag, if true, indicates this schema was required in the parent schema. */
  required?: boolean;
  /** Optional flag, if true, indicates this schema was required because it is the root. */
  requiredAsRoot?: boolean;
  /** Optional flag, if true, It will merge defaults into formData.
   *  The formData should take precedence unless it's not valid. This is useful when for example the value from formData does not exist in the schema 'enum' property, in such cases we take the value from the defaults because the value from the formData is not valid.
   */
  shouldMergeDefaultsIntoFormData?: boolean;
}

/** Returns the option of a field that is not an object as `getRenderedOptionSchema()` renders it, carrying the
 * `default` of the parent it was rendered from. The rendered option leaves the parent's `default` on the parent, but
 * the option's defaults are seeded from it, so the two are merged as `mergeSchemas()` merges them for an object.
 *
 * @param parent - The schema holding the options, without them
 * @param renderedOption - The selected option as it is rendered
 * @returns - The rendered option with the parent's `default` merged into its own
 */
function withDefaultOf(parent: GenericObjectType, renderedOption: GenericObjectType): GenericObjectType {
  return DEFAULT_KEY in parent ? mergeSchemas({ [DEFAULT_KEY]: parent[DEFAULT_KEY] }, renderedOption) : renderedOption;
}

/** Returns the defaults the fold computed as the form data type the caller declared. Nothing at runtime can check a
 * value against `T`, so it is taken at its word here, through `getByPath()`'s one deliberate cast, rather than at each
 * place a default is handed back.
 *
 * @param value - The defaults the fold computed
 * @returns - The same value, typed as the caller declared it
 */
function asDeclared<R>(value: unknown): R {
  return getByPath<R>({ value }, 'value');
}

/** A field the defaults fold computes the defaults of: the seeds it is planned from and what the recursion rule knows
 * of the way to it
 */
interface DefaultsField<S extends StrictRJSFSchema> {
  readonly graph: SchemaGraph<S>;
  readonly seeds: readonly Seed[];
  /** Whether the field lies within the expansion of a collapsed field, where a further collapse stops the fold */
  readonly expanded: boolean;
  readonly edge: ContainmentEdge;
  /** Whether the field is resolved as `retrieveSchema()` resolves a schema, merging every `allOf` and `if` and stubbing
   * the extra keys of its data, as `getDefaultFormState()` resolves its root
   */
  readonly retrieves?: boolean;
  /** The schema of a field no subschema seeds, such as the stub of an extra key whose type is guessed from its data */
  readonly fallback?: S;
}

/** A field's schema as the fold reads it, with the seeds of its children */
interface DefaultsView<S extends StrictRJSFSchema> {
  /** The field as settled: an expanded field restarts its seeds */
  readonly field: DefaultsField<S>;
  readonly schema: S;
  readonly children: PlanChildren;
  /** The nodes the field's plan merged, in plan order, none for a schema read as it stands */
  readonly entries: readonly PlanEntry[];
  /** The option lists the field's plan met */
  readonly choices: readonly OptionChoice[];
  /** The keywords the field's own nodes declare, before any of them is merged */
  readonly keywords: ReadonlySet<string>;
  /** Whether the rule collapsed the field, which keeps only its own keywords */
  readonly collapsed: boolean;
  /** Whether the extra keys of the object's data are stubbed among its `properties` */
  readonly stubs: boolean;
  /** The options the fold has selected for the field so far */
  readonly options: OptionState;
  /** The `allOf` and `if` policies the field was planned with, which planning it again with an option keeps */
  readonly allOf: boolean | 'if';
  readonly conditions: boolean;
  readonly data: unknown;
  readonly depData: unknown;
}

/** The options selected for a field: the option chosen from each list, by the node holding it, and the lists chosen
 * from, which an option leading back to one of them does not offer again
 */
interface OptionState {
  readonly selections: ReadonlyMap<NodeId, number>;
  readonly chosen: ReadonlySet<unknown>;
}

const NO_OPTIONS: OptionState = { selections: new Map(), chosen: new Set() };

/** A child computed in an earlier pass of its object's dependency fixed point, and what it was computed from */
interface MemoEntry {
  readonly inputs: readonly unknown[];
  readonly value: unknown;
}

/** The props the fold hands each field: those of `computeDefaults()`, holding the data as it comes */
interface FoldProps<T, S extends StrictRJSFSchema, F extends FormContextType> extends Omit<
  ComputeDefaultsProps<T, S, F>,
  'parentDefaults' | 'rawFormData' | 'rootSchema'
> {
  parentDefaults?: unknown;
  rawFormData?: unknown;
  /** The children of the field computed so far, which a pass of the field's dependency fixed point reuses when they
   * would be computed from the same inputs again
   */
  memo?: Map<string, MemoEntry>;
}

/** The props `foldView()` computes a field with: the field's own, with what it reports the last view it computed the
 * field from to, which is the field's view with its options selected, whose `dependencies` the field's fixed point
 * qualifies
 */
interface ViewProps<T, S extends StrictRJSFSchema, F extends FormContextType> extends FoldProps<T, S, F> {
  track: (view: DefaultsView<S>) => void;
}

/** Returns the policy fields are planned with: which `allOf`s and `if`s are merged, and which options. An option beside
 * `dependencies` is merged as the one the data and the defaults so far match first; an option the fold selected is
 * merged as selected. Every other option list is left on the schema for the fold to select from.
 */
function policyFor<S extends StrictRJSFSchema, F extends FormContextType>(
  validator: ValidatorType<S, F>,
  allOf: boolean | 'if',
  conditions: boolean,
  selections: ReadonlyMap<NodeId, number>,
  cutRecursion = false,
): PlanPolicy<S> {
  let key = `defaults|${allOf}|${conditions}|${cutRecursion}`;
  for (const [provider, index] of selections) {
    key += `|${provider}:${index}`;
  }
  return cachedPolicy<S>(validator, key, () => ({
    allOf,
    conditions,
    cutRecursion,
    selectOption: (request) =>
      selections.get(request.provider) ?? dependencyOption(validator, request, request.depData),
    // An option the fold selects keeps the ref path of the node offering it: restarting it, as render does, would
    // restart it at every level of a recursion through an option chosen without data, which nothing then bounds
    optionsInheritRefPath: true,
  }));
}

/** The keywords the field's own nodes declare: its seeds and the targets of their `$ref`s */
function ownKeywords<S extends StrictRJSFSchema>(plan: MergePlan<S>): Set<string> {
  const keywords = new Set<string>();
  for (const { node: id, edge } of plan.entries) {
    const node = plan.graph.node(id);
    if ((edge === 'seed' || edge === 'ref') && node.kind === 'schema') {
      const own = edge === 'ref' ? asTarget(plan.graph, node) : node;
      Object.keys(own.raw).forEach((key) => keywords.add(key));
    }
  }
  return keywords;
}

/** Whether a field with these keywords stubs the extra keys of its data: one that is resolved whole, one with an
 * `allOf` it merges under `allOf: 'populateDefaults'`, and one with an `if`, unless `emptyObjectFields` is
 * `skipEmptyDefaults`
 */
function stubsFor<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  field: DefaultsField<S>,
  keywords: ReadonlySet<string>,
): boolean {
  const behavior = context.defaultFormStateBehavior;
  return (
    field.retrieves === true ||
    (behavior?.allOf === 'populateDefaults' && keywords.has(ALL_OF_KEY)) ||
    (behavior?.emptyObjectFields !== 'skipEmptyDefaults' && keywords.has(IF_KEY))
  );
}

/** A field's plan, with the `allOf` and `if` policies it was planned with */
interface PlannedField<S extends StrictRJSFSchema> {
  readonly plan: MergePlan<S>;
  readonly allOf: boolean | 'if';
  readonly conditions: boolean;
}

/** The view of a field planned with `plan` */
function planView<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  field: DefaultsField<S>,
  { plan, allOf, conditions }: PlannedField<S>,
  options: OptionState,
  data: unknown,
  depData: unknown,
): DefaultsView<S> {
  // An option list the plan merged an option of is no longer offered, unless the option declares one of its own
  const dropped = plan.choices
    .filter(({ selected, list, keyword }) => selected !== undefined && list === plan.schema[keyword])
    .map(({ keyword }) => keyword);
  const schema = dropped.length > 0 ? withoutKeys(plan.schema, ...dropped) : plan.schema;
  const keywords = ownKeywords(plan);
  return {
    field,
    schema,
    children: plan.children,
    entries: plan.entries,
    choices: plan.choices,
    keywords,
    collapsed: false,
    stubs: stubsFor(context, field, keywords),
    options,
    allOf,
    conditions,
    data,
    depData,
  };
}

/** The view of a field read without resolving anything: `schema` as it stands, with the children its seeds declare
 * themselves
 */
function ownView<S extends StrictRJSFSchema>(field: DefaultsField<S>, schema: S, data: unknown): DefaultsView<S> {
  return {
    field,
    schema,
    children: ownChildren(field.graph, field.seeds),
    entries: [],
    choices: [],
    keywords: new Set(Object.keys(schema)),
    collapsed: false,
    stubs: false,
    options: NO_OPTIONS,
    allOf: true,
    conditions: true,
    data,
    depData: data,
  };
}

/** Plans `field` for `data` and the dependency data `depData` with the options selected so far, and applies the
 * recursion rule to the plan. A collapsed field that is not within an expansion yet is expanded once (I2), restarting
 * its seeds; one within an expansion keeps all but its recursive edges.
 *
 * Where `getObjectDefaults()` resolved a schema, the plan does too: every field merges its `$ref`, and its `then` or
 * `else` unless `emptyObjectFields` is `skipEmptyDefaults`, in which case only one whose `allOf` is merged under
 * `allOf: 'populateDefaults'` does. An `allOf` is merged under that setting, or for a field whose own keywords hold an
 * `if`, or for a field that `retrieves`. A field planned again with an option keeps the policies it was planned with.
 */
function settle<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  field: DefaultsField<S>,
  data: unknown,
  depData: unknown,
  options: OptionState = NO_OPTIONS,
  inherited?: Pick<PlannedField<S>, 'allOf' | 'conditions'>,
): DefaultsView<S> {
  const { graph } = field;
  if (field.seeds.length === 0) {
    return ownView(field, field.fallback ?? schemaFrom(graph.rawRoot, {}), data);
  }
  const behavior = context.defaultFormStateBehavior;
  const populate = behavior?.allOf === 'populateDefaults';
  const planWith = (
    seeds: readonly Seed[],
    allOf: boolean | 'if',
    conditions: boolean,
    cutRecursion: boolean,
  ): PlannedField<S> => {
    const policy = policyFor(context.validator, allOf, conditions, options.selections, cutRecursion);
    return { plan: buildPlan<S, F>({ context, graph, seeds, data, depData, policy }), allOf, conditions };
  };
  const planFor = (seeds: readonly Seed[], cutRecursion = false): PlannedField<S> => {
    if (inherited) {
      return planWith(seeds, inherited.allOf, inherited.conditions, cutRecursion);
    }
    if (field.retrieves) {
      return planWith(seeds, true, true, cutRecursion);
    }
    if (behavior?.emptyObjectFields !== 'skipEmptyDefaults') {
      return planWith(seeds, populate || 'if', true, cutRecursion);
    }
    const withoutConditions = planWith(seeds, populate, false, cutRecursion);
    return populate && ownKeywords(withoutConditions.plan).has(ALL_OF_KEY)
      ? planWith(seeds, true, true, cutRecursion)
      : withoutConditions;
  };
  const planned = planFor(field.seeds);
  if (!collapses(graph, planned.plan, { edge: field.edge, view: 'defaults' })) {
    return planView(context, field, planned, options, data, depData);
  }
  if (field.expanded) {
    // Only the recursive edges are cut: the field keeps its own keywords, those beside its `$ref` included, and every
    // subschema it merges that does not lead back up its ref path
    return { ...planView(context, field, planFor(field.seeds, true), options, data, depData), collapsed: true };
  }
  const seeds = restartSeeds(field.seeds);
  const expanded: DefaultsField<S> = { ...field, seeds, expanded: true };
  return planView(context, expanded, planFor(seeds), options, data, depData);
}

/** Returns the child of `view` that `seeds` seed, reached through `edge`. A subschema the schema's own keywords stand
 * in for, `fallback`, such as the stub of a key whose type is guessed from its data where `additionalProperties` is
 * `true`, is read as it stands where no seed is more than a boolean.
 */
function defaultsChild<S extends StrictRJSFSchema>(
  view: DefaultsView<S>,
  seeds: readonly Seed[],
  edge: ContainmentEdge,
  fallback?: unknown,
): DefaultsField<S> {
  const { graph, expanded } = view.field;
  const useFallback = isObject(fallback) && seeds.every(({ node }) => graph.node(node).kind === 'boolean');
  return {
    graph,
    seeds: useFallback ? [] : seeds,
    expanded,
    edge,
    fallback: useFallback ? schemaFrom(graph.rawRoot, fallback) : undefined,
  };
}

/** Computes the defaults of `field` from the fold's state at it. A field whose plan has `dependencies` is planned again
 * while the defaults computed so far, under its data, qualify a set of them it was not planned with: there is no cap on
 * the passes, since qualification only grows with the keys the defaults bring, and a set seen before ends the loop all
 * the same. A child computed in an earlier pass from the same inputs is not computed again.
 */
function foldField<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  field: DefaultsField<S>,
  props: FoldProps<T, S, F>,
): { value: unknown; view: DefaultsView<S> } {
  const data = props.rawFormData;
  let view = settle(context, field, data, data);
  // The options the field selected are planned with it, so the dependencies they bring are qualified too
  let lastView = view;
  const track = (computed: DefaultsView<S>) => {
    lastView = computed;
  };
  const passProps = { ...props, memo: new Map<string, MemoEntry>(), track };
  let value = foldView(context, view, passProps);
  const seen = new Set([qualifiedDependencies(lastView, data)]);
  for (;;) {
    const depData = { ...(isObject(value) ? value : {}), ...(isObject(data) ? data : {}) };
    const qualified = qualifiedDependencies(lastView, depData);
    if (seen.has(qualified)) {
      return { value, view };
    }
    seen.add(qualified);
    view = settle(context, field, data, depData);
    value = foldView(context, view, passProps);
  }
}

/** The `dependencies` of the field's plan whose keys `depData` holds a value for, as a key equal for equal sets */
function qualifiedDependencies<S extends StrictRJSFSchema>(view: DefaultsView<S>, depData: unknown): string {
  const { graph } = view.field;
  return view.entries
    .flatMap(({ node: id }) => {
      const node = graph.node(id);
      const keys = node.kind === 'schema' ? [...(node.dependencies?.keys() ?? [])] : [];
      return keys.filter((key) => getByPath(depData, key) !== undefined).map((key) => `${id}:${key}`);
    })
    .join(',');
}

/** Computes the defaults of the child `child` of a field, memoized across the passes of the field's fixed point */
function foldChild<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  memoKey: string,
  child: DefaultsField<S>,
  props: FoldProps<T, S, F>,
  memo: Map<string, MemoEntry> | undefined,
): unknown {
  const inputs = [
    context,
    seedsKey(child.seeds),
    child.expanded,
    child.fallback,
    props.parentDefaults,
    props.rawFormData,
    props.required,
    props.includeUndefinedValues,
    props.uiSchema,
    props.shouldMergeDefaultsIntoFormData,
  ];
  const entry = memo?.get(memoKey);
  if (entry?.inputs.every((input, index) => Object.is(input, inputs[index]))) {
    return entry.value;
  }
  const { value } = foldField<T, S, F>(context, child, { ...props, memo: undefined });
  memo?.set(memoKey, { inputs, value });
  return value;
}

/** Computes the defaults of a field from its view: the `const`, `default` and parent defaults that apply to it, the
 * defaults of its tuple items, the option it selects and the defaults its type gives it, over which its data is merged
 * when `shouldMergeDefaultsIntoFormData` is set
 */
function foldView<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  inputProps: ViewProps<T, S, F>,
): unknown {
  const { defaultFormStateBehavior } = context;
  const {
    parentDefaults,
    rawFormData,
    includeUndefinedValues = false,
    required,
    shouldMergeDefaultsIntoFormData = false,
    initialDefaultsGenerated,
    uiSchema: localUiSchema,
    uiSchemaDefinitions,
  } = inputProps;
  const { schema } = view;
  const rootSchema = view.field.graph.rawRoot;
  inputProps.track(view);
  // Apply `ui:definitions` at every field, keyed by the `$ref` its plan was resolved from, so defaults see the same
  // uiSchema `SchemaField` renders with
  const uiSchema = uiSchemaDefinitions
    ? resolveUiSchema<T, S, F>(schema, localUiSchema, { rootSchema, uiSchemaDefinitions })
    : localUiSchema;
  const props = uiSchema === localUiSchema ? inputProps : { ...inputProps, uiSchema };
  const formData = isObject(rawFormData) ? rawFormData : {};
  // Compute the defaults recursively: give highest priority to deepest nodes unless nestedDefaultsPrecedence is ancestorWins.
  let defaults: unknown = parentDefaults;
  const preferParentDefaults =
    Boolean(defaults) && defaultFormStateBehavior?.nestedDefaultsPrecedence === 'ancestorWins';
  // Worked out by the `oneOf`/`anyOf` branch, so it isn't worked out again for this node's type-based default
  let isWholeValue: boolean | undefined;
  // A collapsed field keeps its own keywords, but selecting an option would plan it again past the collapse. A list the
  // field has chosen from already is reached again only through an option leading back to it, which ends the choice
  const offered = view.collapsed ? undefined : getXxxOfOptions<S>(schema);
  const xxxOf = offered && !view.options.chosen.has(offered.options) ? offered : undefined;
  if (
    schema[CONST_KEY] !== undefined &&
    defaultFormStateBehavior?.constAsDefaults !== 'never' &&
    !constIsAjvDataReference(schema)
  ) {
    defaults = schema[CONST_KEY];
  } else if (isObject(defaults) && isObject(schema.default) && !xxxOf && !isWholeValueSelect<S>(schema)) {
    // For object defaults, merge defaults by precedence setting.
    // Skip this for anyOf/oneOf schemas, which need special handling, and for a select over object constants,
    // whose own default and inherited default each name a whole constant, so a blend of them names none.
    defaults = preferParentDefaults ? mergeObjects(schema.default, defaults) : mergeObjects(defaults, schema.default);
  } else if (DEFAULT_KEY in schema && !preferParentDefaults && !xxxOf) {
    // If the schema has a default value and parentDefaults does not have precedence
    // And if the schema does not have anyOf or oneOf (since we need to merge the defaults with the formData)
    // Then we should use it as the default.
    defaults = schema.default;
  } else if (Array.isArray(schema.items) && isFixedItems<S>(schema) && !preferParentDefaults && !xxxOf) {
    // If the schema contains fixed items and parentDefaults does not have precedence
    // Then construct defaults from defaults of array items. A tuple with options is rendered through the selected
    // option, which it is met into below, so its defaults are those of the option as rendered
    defaults = schema.items.map((_item, idx) =>
      foldChild<T, S, F>(
        context,
        `tuple:${idx}`,
        itemField(view, AdditionalItemsHandling.Fallback, idx),
        {
          includeUndefinedValues,
          parentDefaults: Array.isArray(parentDefaults) ? parentDefaults[idx] : undefined,
          rawFormData: formData,
          required,
          shouldMergeDefaultsIntoFormData,
          initialDefaultsGenerated,
          uiSchema: getStaticItemsUiSchema<T, S, F>(uiSchema, idx),
          uiSchemaDefinitions,
        },
        props.memo,
      ),
    );
  } else if (xxxOf) {
    const choice = chooseOption<S, F>(context, rootSchema, schema, xxxOf, rawFormData, defaults, preferParentDefaults);
    isWholeValue = choice.isWholeValue;
    if (!choice.picksWholeOption) {
      return foldOption<T, S, F>(choice.context, view, xxxOf, choice.index, { ...props, parentDefaults: defaults });
    }
    // Resolved here rather than by recursing into the option as a primitive select is, since the option's constant is
    // taken as a whole: filling in its properties or items would reduce it to an empty value no option allows. The
    // constant wins over an inherited default, as it does for a primitive `const`, unless constants are never defaults.
    // The `ui:initialValue`/`ui:emptyValue` below still apply, and any form data is kept as it is by `typeDefaults()`
    if (rawFormData === undefined && choice.context.defaultFormStateBehavior?.constAsDefaults !== 'never') {
      defaults = toConstant<S>(xxxOf.options[choice.index]);
    }
  }

  // No defaults defined for this node, fallback to generic typed ones.
  if (defaults === undefined) {
    defaults = schema.default;
  }

  // `ui:initialValue` takes priority over `schema.default`; `ui:emptyValue` is only used as a last resort, when
  // nothing else (formData, schema default or `ui:initialValue`) has produced a value for the field.
  if (uiSchema) {
    const { initialValue, emptyValue } = getUiOptions<T, S, F>(uiSchema);
    if (initialValue !== undefined && !initialDefaultsGenerated) {
      defaults = initialValue;
    } else if (defaults === undefined && emptyValue !== undefined) {
      defaults = emptyValue;
    }
  }

  const defaultBasedOnSchemaType = typeDefaults<T, S, F>(context, view, props, defaults, isWholeValue);

  let defaultsWithFormData = defaultBasedOnSchemaType ?? defaults;
  // if shouldMergeDefaultsIntoFormData is true, then merge the defaults into the formData.
  if (shouldMergeDefaultsIntoFormData) {
    const { arrayMinItems = {} } = defaultFormStateBehavior ?? {};
    const { mergeExtraDefaults } = arrayMinItems;

    // An `allOf` merged for the defaults of a field that is not an object is gone from its schema, as it was from the
    // schema `computeDefaults()` recursed into
    const mergedAllOf =
      ALL_OF_KEY in schema ||
      (!view.field.retrieves &&
        view.keywords.has(ALL_OF_KEY) &&
        !(defaultFormStateBehavior?.allOf === 'populateDefaults' && getSchemaType<S>(schema) !== 'object'));
    if (!isObject(rawFormData) || mergedAllOf) {
      // If the formData is not an object which means it's a primitive field, then we need to merge the defaults into the formData.
      // Or if the schema has allOf, we need to merge the defaults into the formData because we don't compute the defaults for allOf.
      defaultsWithFormData = mergeDefaultsWithFormData(
        defaultsWithFormData,
        ensureFormDataMatchingSchema<unknown, S, F>(context, schema, rootSchema, rawFormData),
        mergeExtraDefaults,
        true,
      );
    }
  }

  return defaultsWithFormData;
}

/** Picks the option of a field offering `anyOf`/`oneOf` options that its data, or its default, matches, and the context
 * the option's defaults are computed in
 */
function chooseOption<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  schema: S,
  { key, options }: XxxOfOptions<S>,
  rawFormData: unknown,
  defaults: unknown,
  preferParentDefaults: boolean,
): { context: SchemaContext<S, F>; index: number; isWholeValue: boolean; picksWholeOption: boolean } {
  const { defaultFormStateBehavior } = context;
  const { type = 'null' } = withoutKeys(schema, key);
  // An object or array select holds one of its constants as a whole, the way a primitive select does. The options are
  // checked as well, since a non-empty `enum` makes the schema a select whatever they are, and only a constant can be
  // taken whole
  const isWholeValue = isWholeValueSelect<S>(schema);
  const picksWholeOption = isWholeValue && isConstantOptionList<S>(options, true);
  // Checked on the schema rather than on the keyword read, so a `oneOf` beside the `anyOf` that is read still skips,
  // unless it is empty, which counts as no option list here as it does for the keyword read
  const skipsOneOfConstants =
    Boolean(schema[ONE_OF_KEY]?.length) &&
    !Array.isArray(type) &&
    (PRIMITIVE_TYPES.includes(type) || picksWholeOption) &&
    defaultFormStateBehavior?.constAsDefaults === 'skipOneOf';
  // If we are in a oneOf of a primitive type, or of whole object or array values, then we want to pass
  // constAsDefaults as 'never' for the recursion
  const optionContext: SchemaContext<S, F> = skipsOneOfConstants
    ? { ...context, defaultFormStateBehavior: { ...defaultFormStateBehavior, constAsDefaults: 'never' } }
    : context;
  // A whole value is picked as it stands, so an inherited default naming one of the options is the one to pick
  const inheritedDefault = preferParentDefaults ? defaults : (schema.default ?? defaults);
  const valueToMatch = rawFormData ?? (picksWholeOption ? inheritedDefault : schema.default);
  // A constant option equal to the value is the one it picked, whatever the validator makes of the others
  const equalOptionIndex = picksWholeOption
    ? options.findIndex((option) => deepEquals(toConstant<S>(option), valueToMatch))
    : -1;
  const index =
    equalOptionIndex !== -1
      ? equalOptionIndex
      : getClosestMatchingOption<unknown, S, F>(
          context,
          rootSchema,
          valueToMatch,
          options,
          0,
          getDiscriminatorFieldFromSchema<S>(schema),
        );
  return { context: optionContext, index, isWholeValue, picksWholeOption };
}

/** Computes the defaults of a field from the option at `index` of the options it offers. An object renders its own
 * field beside the option, so the option is merged into the whole field: the field is planned again with the option
 * selected, its seeds joining the plan with the ref path of the node offering it. Any other field renders only the
 * option, as `getRenderedOptionSchema()` renders it, so its defaults are those of the option as rendered, the option's
 * children still seeded beside the field's own. The option's `uiSchema` entry is the one its fields see.
 */
function foldOption<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  { key, options }: XxxOfOptions<S>,
  index: number,
  props: ViewProps<T, S, F>,
): unknown {
  const { schema, field } = view;
  const { graph } = field;
  const rootSchema = graph.rawRoot;
  const remaining = withoutKeys(schema, key);
  const branchProps = { ...props, uiSchema: getOptionUiSchema<T, S, F>(props.uiSchema, key, index) };
  const chosen = new Set(view.options.chosen).add(options);
  // Which of the two the field is gets asked of it with its `allOf` merged, as the fields ask it, since its `type` can
  // come through one. A field naming one type already has it, which an `allOf` can't change, so it is spared the merge
  const fieldSchema =
    ALL_OF_KEY in remaining && typeof getSchemaType<S>(remaining) !== 'string'
      ? retrieveSchema<unknown, S, F>(context, remaining, rootSchema, props.rawFormData)
      : remaining;
  const rendersOwnField = rendersOwnFieldBesideOption<S>(fieldSchema);
  const choice = view.choices.find(
    (offered) => offered.keyword === key && offered.options.length === options.length && offered.list === options,
  );
  if (choice === undefined) {
    // The options are not a list the plan met as it stands, such as one a `customMergeAllOf` rewrote, so the option
    // is read as written and the field computed from it as a schema of its own
    const option = schemaFrom(rootSchema, options[index]);
    const rendered = rendersOwnField
      ? mergeSchemas(remaining, option)
      : withDefaultOf(remaining, getRenderedOptionSchema<S>(remaining, resolveOwnRef<S>(option, rootSchema)));
    const adopted = graph.adopt(schemaFrom(rootSchema, rendered));
    const optionField: DefaultsField<S> = {
      ...field,
      graph: adopted.graph,
      seeds: [{ node: adopted.node, refPath: [] }],
      edge: 'root',
    };
    const optionView = settle(context, optionField, view.data, view.depData);
    return foldView<T, S, F>(context, { ...optionView, options: { ...optionView.options, chosen } }, branchProps);
  }
  const optionNode = choice.options[index];
  const selections = new Map(view.options.selections).set(choice.provider, index);
  // The rule applies to the field with its option merged, since a recursion through an option enters its `$ref` only
  // there: the option collapses where the same recursion written as a property does, whatever the data holds below it
  const merged = settle(context, field, view.data, view.depData, { selections, chosen }, view);
  if (rendersOwnField) {
    return foldView<T, S, F>(context, merged, branchProps);
  }
  // The option as rendered is planned from where the field's settled plan offers it, and cut where that plan was cut
  const optionAlone = buildPlan<S, F>({
    context,
    graph,
    seeds: merged.choices
      .filter(({ list }) => list === options)
      .slice(0, 1)
      .map(({ refPath }) => ({ node: optionNode, refPath })),
    data: view.data,
    depData: view.depData,
    policy: policyFor(context.validator, view.allOf, view.conditions, NO_OPTIONS.selections, merged.collapsed),
  });
  const rendered = getRenderedOptionSchema<S>(remaining, optionAlone.schema);
  return foldView<T, S, F>(
    context,
    { ...merged, schema: schemaFrom(rootSchema, withDefaultOf(remaining, rendered)) },
    branchProps,
  );
}

/** Returns the seeds of the array item `getInnerSchemaForArrayItem()` picks for `additionalItems` and `idx`, and the
 * edge the item is reached through
 */
function innerItemSeeds<S extends StrictRJSFSchema>(
  view: DefaultsView<S>,
  additionalItems: AdditionalItemsHandling,
  idx: number,
): { seeds: readonly Seed[]; edge: ContainmentEdge } {
  const { items, additionalItems: additional } = view.schema;
  const { children } = view;
  if (idx >= 0) {
    if (Array.isArray(items) && idx < items.length && typeof items[idx] !== 'boolean') {
      return { seeds: children.prefixItems[idx] ?? [], edge: 'tupleItem' };
    }
  } else if (items && !Array.isArray(items) && typeof items !== 'boolean') {
    return { seeds: children.items, edge: 'item' };
  }
  if (additionalItems !== AdditionalItemsHandling.Ignore && isObject(additional)) {
    return { seeds: children.additionalItems, edge: 'item' };
  }
  return { seeds: [], edge: 'item' };
}

/** Returns the child of an array field at the item `getInnerSchemaForArrayItem()` picks */
function itemField<S extends StrictRJSFSchema>(
  view: DefaultsView<S>,
  additionalItems: AdditionalItemsHandling,
  idx = -1,
): DefaultsField<S> {
  const { seeds, edge } = innerItemSeeds(view, additionalItems, idx);
  return defaultsChild(view, seeds, edge, getInnerSchemaForArrayItem<S>(view.schema, additionalItems, idx));
}

/** Computes the default value for objects.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param view - The object field's view
 * @param props - The props of the field
 * @param defaults - The defaults computed for the object so far
 * @returns - The defaults of the object's properties
 */
function objectDefaults<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  props: FoldProps<T, S, F>,
  defaults: unknown,
): unknown {
  const { defaultFormStateBehavior } = context;
  const {
    rawFormData,
    includeUndefinedValues = false,
    required,
    shouldMergeDefaultsIntoFormData,
    initialDefaultsGenerated,
    uiSchema,
    uiSchemaDefinitions,
    memo,
  } = props;
  const formData = isObject(rawFormData) ? rawFormData : {};
  const rootSchema = view.field.graph.rawRoot;
  // A field resolved the way `retrieveSchema()` resolves a schema has the extra keys of its data stubbed among its
  // `properties`
  const schema =
    view.stubs && allowsAdditionalProperties<S>(view.schema)
      ? stubExistingAdditionalProperties<unknown, S, F>(context, view.schema, rootSchema, formData)
      : view.schema;
  const parentConst = schema[CONST_KEY];
  const computed: GenericObjectType = {};
  for (const key of Object.keys(schema.properties ?? {})) {
    const propertySchema = getPropertySchema<S>(schema, key);
    // Check if the parent schema has a const property defined AND we are supporting const as defaults, then we
    // should always return the computedDefault since it's coming from the const.
    const hasParentConst = isObject(parentConst) && Reflect.get(parentConst, key) !== undefined;
    const hasConst =
      ((isObject(propertySchema) && CONST_KEY in propertySchema) || hasParentConst) &&
      defaultFormStateBehavior?.constAsDefaults !== 'never' &&
      !constIsAjvDataReference(propertySchema);
    // A property stubbed by `stubExistingAdditionalProperties()` from `additionalProperties`/`patternProperties`
    // (flagged here, same as ObjectField's own rendering) shares `uiSchema.additionalProperties` with every other such
    // property, rather than a dynamically-named entry.
    const addedByAdditionalProperty =
      isObject(propertySchema) && Boolean(Reflect.get(propertySchema, ADDITIONAL_PROPERTY_FLAG));
    const { seeds, edge } = childSeeds(view, key);
    // Compute the defaults for this node, with the parent defaults we might have from a previous run: defaults[key].
    const computedDefault = foldChild<T, S, F>(
      context,
      `property:${key}`,
      defaultsChild(view, seeds, edge, propertySchema),
      {
        includeUndefinedValues: includeUndefinedValues === true,
        parentDefaults: getByPath(defaults, key),
        rawFormData: getByPath(formData, key),
        required: schema.required?.includes(key),
        shouldMergeDefaultsIntoFormData,
        initialDefaultsGenerated,
        uiSchema: getByPath<UiSchema<T, S, F> | undefined>(
          uiSchema,
          addedByAdditionalProperty ? ADDITIONAL_PROPERTIES_KEY : key,
        ),
        uiSchemaDefinitions,
      },
      memo,
    );

    maybeAddDefaultToObject(
      computed,
      key,
      computedDefault,
      includeUndefinedValues,
      required,
      schema.required,
      defaultFormStateBehavior?.emptyObjectFields,
      hasConst,
      isObject(propertySchema) && propertySchema.type === 'null',
    );
  }
  const { additionalProperties } = schema;
  if (additionalProperties && !initialDefaultsGenerated) {
    // as per spec additionalProperties may be either schema or boolean
    const additionalPropertiesSchema = schemaFrom(
      rootSchema,
      isObject(additionalProperties) ? additionalProperties : {},
    );
    const keys = new Set<string>();
    const formDataRequired: string[] = [];
    Object.keys(formData)
      .filter((key) => !schema.properties || !schema.properties[key])
      .forEach((key) => {
        keys.add(key);
        formDataRequired.push(key);
      });
    // Only seed keys from schema defaults when formData has no additionalProperties of its own.
    // If the user already has data (e.g. after a key rename), injecting default keys would
    // re-add stale entries that no longer exist in formData.
    if (isObject(defaults) && formDataRequired.length === 0) {
      Object.keys(defaults)
        .filter((key) => !schema.properties || !schema.properties[key])
        .forEach((key) => keys.add(key));
    }
    keys.forEach((key) => {
      const computedDefault = foldChild<T, S, F>(
        context,
        `additional:${key}`,
        defaultsChild(view, view.children.additionalProperties, 'additionalKey', additionalPropertiesSchema),
        {
          includeUndefinedValues: includeUndefinedValues === true,
          parentDefaults: getByPath(defaults, key),
          rawFormData: getByPath(formData, key),
          required: schema.required?.includes(key),
          shouldMergeDefaultsIntoFormData,
          initialDefaultsGenerated,
          // Matches ObjectField's convention for properties added by `additionalProperties`: they all share
          // `uiSchema.additionalProperties` rather than each having its own dynamically-named entry in `uiSchema`.
          uiSchema: getByPath<UiSchema<T, S, F> | undefined>(uiSchema, ADDITIONAL_PROPERTIES_KEY),
          uiSchemaDefinitions,
        },
        memo,
      );
      maybeAddDefaultToObject(
        computed,
        key,
        computedDefault,
        includeUndefinedValues,
        required,
        formDataRequired,
        // A property added by `additionalProperties` is one the user added, so it is populated whatever the form's
        // `emptyObjectFields` says about the properties the schema names
        'populateAllDefaults',
      );
    });
  }
  return computeDefaultBasedOnSchemaTypeAndDefaults<unknown, S>(view.schema, computed);
}

/** Resolves the `uiSchema` for the array item at `idx`, mirroring `getInnerSchemaForArrayItem()`'s own fallback: for
 * a fixed (tuple) `schema` whose tuple doesn't extend to `idx`, that position's data is really an "additional item"
 * (`schema.additionalItems`), so its uiSchema is `uiSchema.additionalItems` rather than the tuple's `uiSchema.items`.
 *
 * @param schema - The array schema being defaulted
 * @param uiSchema - The parent (array) uiSchema, if any
 * @param idx - The index of the item within the array
 * @returns - The uiSchema to use for the item at `idx`
 */
function getItemUiSchemaForIndex<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: S, uiSchema: UiSchema<T, S, F> | undefined, idx: number): UiSchema<T, S, F> | undefined {
  if (Array.isArray(schema.items) && isFixedItems(schema) && idx >= schema.items.length) {
    return getByPath<UiSchema<T, S, F> | undefined>(uiSchema, 'additionalItems');
  }
  return getStaticItemsUiSchema<T, S, F>(uiSchema, idx);
}

/** Computes the default value for arrays.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param view - The array field's view
 * @param props - The props of the field
 * @param initialDefaults - The defaults computed for the array so far
 * @returns - The defaults of the array's items
 */
function arrayDefaults<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  props: FoldProps<T, S, F>,
  initialDefaults: unknown,
): unknown {
  const { defaultFormStateBehavior } = context;
  const {
    rawFormData,
    required,
    requiredAsRoot = false,
    shouldMergeDefaultsIntoFormData,
    initialDefaultsGenerated,
    uiSchema,
    uiSchemaDefinitions,
    memo,
  } = props;
  const { schema } = view;
  const rootSchema = view.field.graph.rawRoot;
  let defaults = initialDefaults;

  const arrayMinItemsStateBehavior = defaultFormStateBehavior?.arrayMinItems ?? {};
  const { populate: arrayMinItemsPopulate, mergeExtraDefaults: arrayMergeExtraDefaults } = arrayMinItemsStateBehavior;

  const neverPopulate = arrayMinItemsPopulate === 'never';
  const ignoreMinItemsFlagSet = arrayMinItemsPopulate === 'requiredOnly';
  const isPopulateAll = arrayMinItemsPopulate === 'all' || (!neverPopulate && !ignoreMinItemsFlagSet);
  const computeSkipPopulate = arrayMinItemsStateBehavior?.computeSkipPopulate ?? (() => false);
  const isSkipEmptyDefaults = defaultFormStateBehavior?.emptyObjectFields === 'skipEmptyDefaults';

  const emptyDefault: unknown[] | undefined = isSkipEmptyDefaults ? undefined : [];
  const itemProps = (idx: number) => ({
    required,
    shouldMergeDefaultsIntoFormData,
    initialDefaultsGenerated,
    uiSchema: getItemUiSchemaForIndex<T, S, F>(schema, uiSchema, idx),
    uiSchemaDefinitions,
  });

  // Inject defaults into existing array defaults
  if (Array.isArray(defaults)) {
    defaults = defaults.map((item: unknown, idx) =>
      foldChild<T, S, F>(
        context,
        `default:${idx}`,
        itemField(view, AdditionalItemsHandling.Fallback, idx),
        {
          ...itemProps(idx),
          parentDefaults: item,
          rawFormData: Array.isArray(rawFormData) ? rawFormData[idx] : undefined,
        },
        memo,
      ),
    );
  }

  // Deeply inject defaults into already existing form data
  if (Array.isArray(rawFormData)) {
    if (neverPopulate) {
      defaults = rawFormData;
    } else {
      const itemDefaults = rawFormData.map((item: unknown, idx) =>
        foldChild<T, S, F>(
          context,
          `row:${idx}`,
          itemField(view, AdditionalItemsHandling.Ignore),
          { ...itemProps(idx), rawFormData: item, parentDefaults: getByPath(defaults, idx) },
          memo,
        ),
      );

      // If the populate 'requiredOnly' flag is set then we only merge and include extra defaults if they are required.
      // Or if populate 'all' is set we merge and include extra defaults.
      const mergeExtraDefaults = ((ignoreMinItemsFlagSet && required) || isPopulateAll) && arrayMergeExtraDefaults;
      defaults = mergeDefaultsWithFormData(defaults, itemDefaults, mergeExtraDefaults);
    }
  }

  const defaultsLength = Array.isArray(defaults) ? defaults.length : 0;

  if (neverPopulate) {
    if (shouldMergeDefaultsIntoFormData && !required) {
      // Optional arrays with no existing data should be omitted entirely rather than defaulted to `[]`.
      // Required arrays still fall through to `defaults ?? emptyDefault` below so that `[]` is surfaced,
      // letting the validator report `minItems` violations instead of a missing-required-property error.
      return defaults;
    }
    return defaults ?? emptyDefault;
  }
  if (ignoreMinItemsFlagSet && !required) {
    // If no form data exists or defaults are set leave the field empty/non-existent, otherwise
    // return form data/defaults
    return defaults;
  }

  let arrayDefault: unknown;
  if (
    !schema.minItems ||
    isMultiSelect<T, S, F>(context, schema, rootSchema) ||
    computeSkipPopulate<S, F>(context, schema, rootSchema) ||
    schema.minItems <= defaultsLength
  ) {
    // we don't want undefined defaults unless it is both not required or not required as root
    arrayDefault = defaults || (!required && !requiredAsRoot) ? defaults : emptyDefault;
  } else {
    const defaultEntries: unknown[] = Array.isArray(defaults) ? defaults : [];
    const fillerDefault = getInnerSchemaForArrayItem<S>(schema, AdditionalItemsHandling.Invert).default;

    // Calculate filler entries for remaining items (minItems - existing raw data/defaults), each resolving the
    // uiSchema for its own final position (`defaultsLength + i`) the same way `ArrayField` resolves it once rendered,
    // rather than sharing a single uiSchema across every filler row regardless of position.
    const fillerEntries = Array.from({ length: schema.minItems - defaultsLength }, (_unused, i) =>
      foldChild<T, S, F>(
        context,
        `filler:${i}`,
        itemField(view, AdditionalItemsHandling.Invert),
        { ...itemProps(defaultsLength + i), parentDefaults: fillerDefault },
        memo,
      ),
    );
    // then fill up the rest with either the item default or empty, up to minItems
    arrayDefault = defaultEntries.concat(fillerEntries);
  }

  return computeDefaultBasedOnSchemaTypeAndDefaults<unknown, S>(schema, arrayDefault);
}

/** Computes the default value based on the schema type.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param view - The field's view
 * @param props - The props of the field
 * @param defaults - The defaults computed for the field so far
 * @param [isWholeValue] - Whether the field is a select over whole object or array values, when already known
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
function typeDefaults<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  props: FoldProps<T, S, F>,
  defaults: unknown,
  isWholeValue = isWholeValueSelect<S>(view.schema),
): unknown {
  const { uiSchema, rawFormData } = props;
  // A select over object or array constants picks one of them as a whole, so it has no contents of its own to fill in,
  // and an empty object or array would be a value none of its options allow. A value already picked is kept as it is,
  // since the form data is merged over the defaults key by key, which would blend it with the default constant
  if (isWholeValue) {
    // A `null` value is one the user picked, so only a missing one falls back to the default
    return rawFormData === undefined ? defaults : rawFormData;
  }
  // A `ui:widget` that `SchemaField` renders through another listed type's field takes that type's default, so a
  // required `['null', 'boolean', 'string']` shown as a `textarea` isn't seeded with a `false` the textarea can't show
  const { schema } = view;
  const isTypeList = Array.isArray(schema.type);
  const type = getFieldTypeForUiSchema<T, S, F>(schema, uiSchema);
  // A value of another type a `type` list names is left as it is, as `omitExtraData()` and
  // `getUiRequiredErrorSchema()` leave it: an object held by a `['null', 'array', 'object']` has no array items spread
  // into it, and a `null` held by a `['null', 'object']` is not filled in with the object's defaults. With no value,
  // a default of another listed type is kept the same way, so a `default: 'abc'` on a `['null', 'object', 'string']`
  // isn't replaced by the object's. A `null` default is left to `computeDefaultBasedOnSchemaTypeAndDefaults()`
  const value = rawFormData === undefined && defaults !== null ? defaults : rawFormData;
  if (isTypeList && (type === 'object' || type === 'array') && getSchemaTypeForValue<S>(schema, value) !== type) {
    return undefined;
  }
  switch (type) {
    // We need to recurse for object schema inner default values.
    case 'object': {
      return objectDefaults<T, S, F>(context, view, props, defaults);
    }
    case 'array': {
      return arrayDefaults<T, S, F>(context, view, props, defaults);
    }
    case 'boolean': {
      // A required boolean with no explicit default gets false — it must be
      // present in the submitted data, and false is the natural zero-value.
      // `requiredBooleanDefault: 'skip'` opts out for forms that treat an
      // unanswered boolean as a distinct state and rely on `required` to flag it.
      const requiredBooleanDefault = context.defaultFormStateBehavior?.requiredBooleanDefault;
      if (requiredBooleanDefault !== 'skip' && props.required && defaults === undefined) {
        return false;
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

/** Returns the field a call to one of the exported helpers starts from: `rawSchema` as a call root of the graph of
 * `rootSchema`, from which its `$ref`s resolve
 */
function callRoot<S extends StrictRJSFSchema>(rootSchema: S | undefined, rawSchema: S): DefaultsField<S> {
  const adopted = parseSchemaGraph<S>(rootSchema ?? schemaFrom(rawSchema, {})).adopt(rawSchema);
  return { graph: adopted.graph, seeds: [{ node: adopted.node, refPath: [] }], expanded: false, edge: 'root' };
}

/** The view the exported helpers read `rawSchema` through: the schema as it stands, or, for one with an `if` (unless
 * `emptyObjectFields` is `skipEmptyDefaults`) or an `allOf` merged under `allOf: 'populateDefaults'`, resolved as
 * `retrieveSchema()` resolves it
 */
function helperView<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rawSchema: S,
  rootSchema: S | undefined,
  rawFormData: unknown,
): DefaultsView<S> {
  const field = callRoot<S>(rootSchema, rawSchema);
  const behavior = context.defaultFormStateBehavior;
  const retrieves =
    shouldPopulateAllOfDefaults<S>(rawSchema, behavior) ||
    (behavior?.emptyObjectFields !== 'skipEmptyDefaults' && IF_KEY in rawSchema);
  const formData = isObject(rawFormData) ? rawFormData : {};
  return retrieves
    ? settle<S, F>(context, { ...field, retrieves }, formData, formData)
    : ownView(field, rawSchema, rawFormData);
}

/** Computes the defaults for the current `schema` given the `rawFormData` and `parentDefaults` if any. This drills into
 * each level of the schema, recursively, to fill out every level of defaults provided by the schema. The schema is a
 * call root: the recursion rule starts afresh from it.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rawSchema - The schema for which the default state is desired
 * @param computeDefaultsProps - Optional props for this function
 * @returns - The resulting `formData` with all the defaults provided
 */
export function computeDefaults<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, rawSchema: S, inputProps: ComputeDefaultsProps<T, S, F> = {}): T | T[] | undefined {
  const field = callRoot<S>(inputProps.rootSchema, rawSchema);
  return asDeclared<T | T[] | undefined>(foldField<T, S, F>(context, field, inputProps).value);
}

/** Computes the default value for objects, reading the properties `rawSchema` declares as it stands, unless it holds
 * an `allOf` under `allOf: 'populateDefaults'`, or an `if` while `emptyObjectFields` is not `skipEmptyDefaults`, which
 * it is resolved for first.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rawSchema - The schema for which the default state is desired
 * @param computeDefaultsProps - Optional props for this function
 * @param defaults - Optional props for this function
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
export function getObjectDefaults<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rawSchema: S,
  computeDefaultsProps: ComputeDefaultsProps<T, S, F> = {},
  defaults?: T | T[],
): T {
  const { rootSchema, rawFormData } = computeDefaultsProps;
  const view = helperView<S, F>(context, rawSchema, rootSchema, rawFormData);
  return asDeclared<T>(objectDefaults<T, S, F>(context, view, computeDefaultsProps, defaults));
}

/** Computes the default value for arrays, reading the items `rawSchema` declares as it stands.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rawSchema - The schema for which the default state is desired
 * @param computeDefaultsProps - Optional props for this function
 * @param initialDefaults - Optional props for this function
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
export function getArrayDefaults<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rawSchema: S,
  computeDefaultsProps: ComputeDefaultsProps<T, S, F> = {},
  initialDefaults?: T[],
): T[] | undefined {
  const field = callRoot<S>(computeDefaultsProps.rootSchema, rawSchema);
  const view = ownView(field, rawSchema, computeDefaultsProps.rawFormData);
  return asDeclared<T[] | undefined>(arrayDefaults<T, S, F>(context, view, computeDefaultsProps, initialDefaults));
}

/** Computes the default value based on the schema type, reading `rawSchema` as `getObjectDefaults()` and
 * `getArrayDefaults()` read it.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rawSchema - The schema for which the default state is desired
 * @param computeDefaultsProps - Optional props for this function
 * @param defaults - Optional props for this function
 * @param [isWholeValue] - Whether `rawSchema` is a select over whole object or array values, when already known
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
export function getDefaultBasedOnSchemaType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rawSchema: S,
  computeDefaultsProps: ComputeDefaultsProps<T, S, F> = {},
  defaults?: T | T[],
  isWholeValue?: boolean,
): T | T[] | undefined {
  const { rootSchema, rawFormData } = computeDefaultsProps;
  const view = helperView<S, F>(context, rawSchema, rootSchema, rawFormData);
  return asDeclared<T | T[] | undefined>(
    typeDefaults<T, S, F>(context, view, computeDefaultsProps, defaults, isWholeValue),
  );
}

/**
 * Ensure that the formData matches the given schema. If it's not matching in the case of a selectField, we change it to match the schema.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which the formData state is desired
 * @param rootSchema - The root schema, used to primarily to look up `$ref`s
 * @param formData - The current formData
 * @returns - valid formData that matches schema
 */
export function ensureFormDataMatchingSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, schema: S, rootSchema: S, formData: T | undefined): T | T[] | undefined {
  const { defaultFormStateBehavior } = context;
  const shouldRetrieveAllOf = shouldPopulateAllOfDefaults(schema, defaultFormStateBehavior);
  const schemaToMatch = shouldRetrieveAllOf ? retrieveSchema<T, S, F>(context, schema, rootSchema, formData) : schema;
  // Without data there is nothing to check against the options of a select, so only data asks whether it is one
  const isSelectField =
    formData !== undefined && !isConstant<S>(schemaToMatch) && isSelect<T, S, F>(context, schemaToMatch, rootSchema);
  let validFormData: unknown = formData;
  if (isSelectField) {
    const getOptionsList = optionsList<T, S, F>(schemaToMatch);
    // An empty option list has no value to check the data against, so the data is kept, as it is without the list
    if (getOptionsList?.length !== 0) {
      validFormData = getOptionsList?.some((option) => deepEquals(option.value, formData)) ? formData : undefined;
    }
  }

  // Override the formData with the const if the constAsDefaults is set to always
  const constTakesPrecedence = schemaToMatch[CONST_KEY] && defaultFormStateBehavior?.constAsDefaults === 'always';
  if (constTakesPrecedence) {
    validFormData = schemaToMatch.const;
  } else if (isObject(validFormData) && isObject(schemaToMatch.properties)) {
    const matched: GenericObjectType = { ...validFormData };
    for (const key of Object.keys(schemaToMatch.properties)) {
      const propertySchema = getPropertySchema<S>(schemaToMatch, key);
      if (key in matched && (shouldRetrieveAllOf || (isObject(propertySchema) && ALL_OF_KEY in propertySchema))) {
        matched[key] = ensureFormDataMatchingSchema<unknown, S, F>(context, propertySchema, rootSchema, matched[key]);
      }
    }
    validFormData = matched;
  }

  return asDeclared<T | T[] | undefined>(validFormData);
}

/** Returns the superset of `formData` that includes the given set updated to include any missing fields that have
 * computed to have defaults provided in the `schema`.
 *
 * The defaults are one fold over the field tree: each field is planned from the subschemas it is reached through with
 * its `$ref`s, `allOf`, `if`/`then`/`else` and `dependencies` merged, and the recursion rule decides where a recursive
 * schema stops, expanding each recursion it stops once.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param props - The `GetDefaultFormStateProps` for this function
 * @returns - The resulting `formData` with all the defaults provided
 */
export default function getDefaultFormState<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  {
    schema: theSchema,
    formData,
    rootSchema,
    includeUndefinedValues = false,
    initialDefaultsGenerated,
    uiSchema,
    // Defaults to the `ui:definitions` on `uiSchema` itself, but callers that only have a sub-uiSchema in hand
    // (an array's `uiSchema.items`, a `oneOf`/`anyOf` option's own uiSchema, `uiSchema.additionalProperties`, ...)
    // need to pass the root uiSchema's `ui:definitions` explicitly, since `ui:definitions` only ever lives at the root.
    uiSchemaDefinitions = uiSchema?.[UI_DEFINITIONS_KEY],
  }: GetDefaultFormStateProps<T, S, F>,
): T | T[] | undefined {
  if (!isObject(theSchema)) {
    throw new Error(`Invalid schema: ${String(theSchema)}`);
  }
  const root = rootSchema ?? theSchema;
  // The root is resolved as `retrieveSchema()` resolves it, its `allOf` merged and the extra keys of its data stubbed
  const field: DefaultsField<S> = { ...callRoot<S>(root, theSchema), retrieves: true };
  // Get the computed defaults with 'shouldMergeDefaultsIntoFormData' set to true to merge defaults into formData.
  // This is done when for example the value from formData does not exist in the schema 'enum' property, in such
  // cases we take the value from the defaults because the value from the formData is not valid.
  const { value: defaults, view } = foldField<T, S, F>(context, field, {
    includeUndefinedValues,
    rawFormData: formData,
    shouldMergeDefaultsIntoFormData: true,
    initialDefaultsGenerated,
    requiredAsRoot: true,
    uiSchema,
    uiSchemaDefinitions,
  });
  const { schema } = view;

  // Array form data takes the merge path below, which knows how to combine it with the defaults
  if (schema.type !== 'object' && isObject(schema.default) && isObject(defaults) && !Array.isArray(formData)) {
    return asDeclared<T>({
      ...defaults,
      ...(isObject(formData) ? formData : undefined),
    });
  }

  // If the formData is an object or an array, add additional properties from formData and override formData with
  // defaults since the defaults are already merged with formData.
  if (isObject(formData) || Array.isArray(formData)) {
    const { mergeDefaultsIntoFormData } = context.defaultFormStateBehavior ?? {};
    const defaultSupercedesUndefined = mergeDefaultsIntoFormData === 'useDefaultIfFormDataUndefined';
    const matchingFormData = ensureFormDataMatchingSchema<T, S, F>(context, schema, view.field.graph.rawRoot, formData);
    return asDeclared<T | T[] | undefined>(
      mergeDefaultsWithFormData(
        defaults,
        matchingFormData,
        true, // set to true to add any additional default array entries.
        defaultSupercedesUndefined,
        true, // set to true to override formData with defaults if they exist.
      ),
    );
  }

  return asDeclared<T | T[] | undefined>(defaults);
}
