import { allowsAdditionalProperties } from '../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  DEPENDENCIES_KEY,
  IF_KEY,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  UI_DEFINITIONS_KEY,
  UI_GLOBAL_OPTIONS_KEY,
} from '../constants.ts';
import constIsAjvDataReference from '../constIsAjvDataReference.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getOptionUiSchema from '../getOptionUiSchema.ts';
import getPropertySchema from '../getPropertySchema.ts';
import getRenderedOptionSchema from '../getRenderedOptionSchema.ts';
import getSchemaOwnTypes from '../getSchemaOwnTypes.ts';
import getSchemaType from '../getSchemaType.ts';
import getSchemaTypeForValue from '../getSchemaTypeForValue.ts';
import getStaticItemsUiSchema from '../getStaticItemsUiSchema.ts';
import getUiOptions from '../getUiOptions.ts';
import { getFieldTypeForUiSchema } from '../getWidget.tsx';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import type { XxxOfOptions } from '../getXxxOfOptions.ts';
import isConstant from '../isConstant.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import isConstantSelect from '../isConstantSelect.ts';
import isFixedItems from '../isFixedItems.ts';
import isFormDataAvailable from '../isFormDataAvailable.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import isPlainObject from '../isPlainObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import mergeDefaultsWithFormData from '../mergeDefaultsWithFormData.ts';
import mergeObjects from '../mergeObjects.ts';
import mergeSchemas from '../mergeSchemas.ts';
import optionsList from '../optionsList.ts';
import { getByPath } from '../pathUtils.ts';
import rendersOwnFieldBesideOption from '../rendersOwnFieldBesideOption.ts';
import resolveUiSchema from '../resolveUiSchema.ts';
import setOwn from '../setOwn.ts';
import { isOptionalDataControlsType } from '../shouldRenderOptionalField.ts';
import toConstant from '../toConstant.ts';
import type {
  CustomMergeAllOf,
  DefaultFormStateBehavior,
  FormContextType,
  GenericObjectType,
  GetDefaultFormStateProps,
  GlobalUISchemaOptions,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  UiSchema,
  ValidatorType,
} from '../types.ts';
import { closestOption } from './getClosestMatchingOption.ts';
import buildPlan, {
  asTarget,
  cachedPolicy,
  childSeeds,
  declaresKeyword,
  ownChains,
  schemaFrom,
  seedsAt,
  seedsKey,
  tupleSeeds,
  withoutKeys,
} from './graph/mergePlan.ts';
import type {
  Keywords,
  MergePlan,
  OptionChoice,
  OptionPolicy,
  PlanEntry,
  PlanPolicy,
  RefPath,
  Seed,
  Seeding,
} from './graph/mergePlan.ts';
import parseSchemaGraph from './graph/parseSchemaGraph.ts';
import type { NodeId, SchemaGraph } from './graph/parseSchemaGraph.ts';
import { readProvenance, rootProvenance } from './graph/provenance.ts';
import type { Provenance } from './graph/provenance.ts';
import { collapses, restartSeeds } from './graph/recursionRule.ts';
import type { ContainmentEdge } from './graph/recursionRule.ts';
import isMultiSelect from './isMultiSelect.ts';
import { resolveDeclaredConstantOptions } from './resolveConstantOptions.ts';
import retrieveSchema, {
  dependencyOption,
  fieldOf,
  isLeafSchema,
  optionNode as offeredOption,
  resolveMergedOwnRef,
  retrieveField,
  stubExistingAdditionalProperties,
} from './retrieveSchema.ts';

const PRIMITIVE_TYPES = ['string', 'number', 'integer', 'boolean', 'null'];

/** The keywords retrieving a schema merges subschemas in through; it leaves the own keywords of a schema holding none */
const MERGING_KEYWORDS = [REF_KEY, ALL_OF_KEY, IF_KEY, DEPENDENCIES_KEY];

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
 * @param holdsNull - Whether `computedDefault` holds the `null` a missing value of a `null` schema is filled in as,
 *        itself or under a property of the objects along the way, see `ComputeDefaultsProps.onNullFill`. It is added
 *        like a const, with those objects, whatever `emptyObjectFields` says: that `null` is the one value the field
 *        rendered for the schema can hold, and the other defaults the objects hold were already left out by this rule
 */
function maybeAddDefaultToObject<T = unknown>(
  acc: GenericObjectType,
  key: string,
  computedDefault: T | T[] | null | undefined,
  includeUndefinedValues: boolean | 'excludeObjectChildren',
  isParentRequired?: boolean,
  requiredFields: string[] = [],
  emptyObjectFields: NonNullable<DefaultFormStateBehavior['emptyObjectFields']> = 'populateAllDefaults',
  isConst = false,
  holdsNull = false,
) {
  if (includeUndefinedValues === true || isConst || holdsNull) {
    // If includeUndefinedValues is explicitly true
    // Or if the schema has a const property defined, then we should always return the computedDefault since it's coming from the const.
    setOwn(acc, key, computedDefault);
  } else if (includeUndefinedValues === 'excludeObjectChildren') {
    // Fix for Issue #4709: When in 'excludeObjectChildren' mode, don't set primitive fields to empty objects
    // Only add the computed default if it's not an empty object placeholder for a primitive field
    if (!isObject(computedDefault) || Object.keys(computedDefault).length > 0) {
      setOwn(acc, key, computedDefault);
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
          setOwn(acc, key, computedDefault);
        }
      } // Else store computedDefault if it's a non-empty object(e.g. not {}) and satisfies certain conditions
      // Condition 1: If computedDefault is not empty or if the key is a required field
      // Condition 2: If the parent object is required or emptyObjectFields is not 'populateRequiredDefaults'
      else if (
        (Object.keys(computedDefault).length > 0 || requiredFields.includes(key)) &&
        (isSelfOrParentRequired || emptyObjectFields !== 'populateRequiredDefaults')
      ) {
        setOwn(acc, key, computedDefault);
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
      setOwn(acc, key, computedDefault);
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
  /** Whether the schema is the `anyOf`/`oneOf` option a field renders, whose `null` option renders no field and so is
   * left without a value
   */
  isRenderedOption?: boolean;
  /** The current formData, if any, onto which to provide any missing defaults */
  rawFormData?: T;
  /** Optional flag, if true, indicates this schema was required in the parent schema. */
  required?: boolean;
  /** Optional flag, if true, indicates this schema was required because it is the root. */
  requiredAsRoot?: boolean;
  /** Called when the defaults computed hold the `null` a missing value of a `null` schema is filled in as, itself or
   * under a property of the objects along the way, wherever the schema brings that property in from: its own
   * `properties`, a `$ref`, `allOf`, `if`/`then`/`else`, `dependencies` or `additionalProperties`, or an item of an
   * array the data holds. The items a `minItems` adds do not report it, since the data holds none of them yet
   */
  onNullFill?: () => void;
  /** What the `null` fills of one `getDefaultFormState()` call share, see `NullFills` */
  nullFills?: NullFills;
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

/** What the `null` fills of one `getDefaultFormState()` call share as they reach every level */
interface NullFills {
  /** The global UI options of the root uiSchema, which decide where a field renders an object with the Optional Data
   * Controls, whose fields render only once the object has a value
   */
  globalUiOptions?: GlobalUISchemaOptions;
  /** For each object of the form data that holds the value of a `null` schema's field as `undefined`, those
   * properties. The data's `undefined` is kept over a default everywhere else, so their `null`s are put in once the
   * defaults are merged into the data: the field of a `null` schema holds `null` whatever it was given
   */
  overUndefined: Map<object, Set<string>>;
  /** Set below an optional object the Optional Data Controls render while it has no value: none of its fields render
   * until the user adds it, so none of their `null`s is filled in, and the object stays out of the defaults as one with
   * no `null` schema in it would
   */
  isCollapsed?: boolean;
}

/** `context` with settings under which the defaults of a schema hold nothing but its `null` fills and the objects
 * leading to them
 *
 * @param context - The `SchemaContext` the defaults are computed in
 * @returns - The context for the `null` fills alone
 */
function nullsOnlyContext<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
): SchemaContext<S, F> {
  return {
    ...context,
    defaultFormStateBehavior: {
      ...context.defaultFormStateBehavior,
      emptyObjectFields: 'skipDefaults',
      constAsDefaults: 'never',
    },
  };
}

/** What in `schema` a `null` fill can come from: the `null` type, named somewhere in it, or else a `$ref`, which can
 * lead to one elsewhere in the root; worked out once for each schema
 */
type NullSource = 'nullType' | 'ref' | 'none';
const nullSourceMemo = new WeakMap<object, NullSource>();
function nullSourceOf(schema: unknown): NullSource {
  if (typeof schema !== 'object' || schema === null) {
    return 'none';
  }
  const memoized = nullSourceMemo.get(schema);
  if (memoized !== undefined) {
    return memoized;
  }
  // Recorded first, so a schema that holds itself is answered from the memo
  nullSourceMemo.set(schema, 'none');
  const type = Array.isArray(schema) ? undefined : Reflect.get(schema, 'type');
  let source: NullSource = 'none';
  if (type === 'null' || (Array.isArray(type) && type.includes('null'))) {
    source = 'nullType';
  } else {
    if (!Array.isArray(schema) && typeof Reflect.get(schema, REF_KEY) === 'string') {
      source = 'ref';
    }
    for (const value of Object.values(schema)) {
      const valueSource = nullSourceOf(value);
      if (valueSource === 'nullType') {
        source = valueSource;
        break;
      }
      if (valueSource === 'ref') {
        source = valueSource;
      }
    }
  }
  nullSourceMemo.set(schema, source);
  return source;
}

/** Whether a `null` fill can come from `schema`: it names the `null` type somewhere in it, or it holds a `$ref` and the
 * root names that type anywhere, which the `$ref` may lead to
 *
 * @param schema - The schema a `null` fill would come from
 * @param rootSchema - The root schema, which the `$ref`s in `schema` resolve against
 * @returns - False when no `null` fill can come from `schema`
 */
function mayHoldNullType(schema: unknown, rootSchema: unknown): boolean {
  const source = nullSourceOf(schema);
  return source === 'nullType' || (source === 'ref' && nullSourceOf(rootSchema) === 'nullType');
}

/** Records the property `key` of `formData`, whose defaults hold a `null` fill, for the `null` to go over the
 * `undefined` the data holds it as, see `NullFills.overUndefined`, when the property is itself the field of a `null`
 * schema: that `null` is the one value the field holds. A property the data does not hold takes it from the merge
 * already, and an object or array held as `undefined` keeps it, with every default of what it holds, as one holding
 * no `null` schema does
 *
 * @param nullFills - The `null` fills of the call
 * @param formData - The object of the form data the property belongs to
 * @param key - The property
 * @param defaults - The property's defaults
 */
function fillOverUndefined(nullFills: NullFills | undefined, formData: unknown, key: string, defaults: unknown) {
  if (
    nullFills &&
    defaults === null &&
    isObject(formData) &&
    Object.hasOwn(formData, key) &&
    formData[key] === undefined
  ) {
    const fills = nullFills.overUndefined.get(formData) ?? new Set<string>();
    fills.add(key);
    nullFills.overUndefined.set(formData, fills);
  }
}

/** Puts the `null` of each `null` schema's field the form data holds as `undefined` into `merged`, see
 * `NullFills.overUndefined`. `merged` holds the keys of `formData` at every level, so the two are walked together. An
 * object or array of `merged` is copied before a `null` goes into it, since a shallow merge hands back the caller's own
 *
 * @param merged - The defaults merged into the form data
 * @param formData - The form data, whose objects `nullFills` names
 * @param nullFills - The `null` fills of the call
 * @returns - `merged` with the `null`s in, or `merged` itself when it takes none
 */
function withNullFills<V>(merged: V, formData: unknown, nullFills: NullFills): V {
  if (
    nullFills.overUndefined.size === 0 ||
    typeof merged !== 'object' ||
    merged === null ||
    typeof formData !== 'object' ||
    formData === null
  ) {
    return merged;
  }
  const fills = nullFills.overUndefined.get(formData);
  let filled = merged;
  for (const [key, value] of Object.entries(formData)) {
    const current: unknown = Reflect.get(merged, key);
    const next =
      fills?.has(key) && Object.hasOwn(merged, key) && current === undefined
        ? null
        : withNullFills(current, value, nullFills);
    if (next !== current) {
      if (filled === merged) {
        filled = Array.isArray(merged) ? Object.assign([], merged) : { ...merged };
      }
      Reflect.set(filled, key, next);
    }
  }
  return filled;
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
  readonly graph: SchemaGraph<S>;
  readonly chains: readonly Keywords<S>[];
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
  /** Whether `value` holds a `null` fill, which a hit reports again */
  readonly holdsNull: boolean;
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
  graph: SchemaGraph<S>,
  allOf: boolean | 'if',
  conditions: boolean,
  selections: ReadonlyMap<NodeId, number>,
  cutRecursion = false,
  optionPolicy?: OptionPolicy,
): PlanPolicy<S> {
  let key = `defaults|${allOf}|${conditions}|${cutRecursion}|${optionPolicy?.allOf}|${optionPolicy?.conditions}`;
  for (const [provider, index] of selections) {
    key += `|${provider}:${index}`;
  }
  return cachedPolicy<S>(validator, graph, key, () => ({
    allOf,
    conditions,
    cutRecursion,
    selectOption: (request) =>
      selections.get(request.provider) ?? dependencyOption(validator, request, request.depData),
    // An option the fold selects keeps the ref path of the node offering it: restarting it, as render does, would
    // restart it at every level of a recursion through an option chosen without data, which nothing then bounds
    optionsInheritRefPath: true,
    optionPolicy,
  }));
}

/** The keywords `ownKeywords()` read, by plan, which a plan never changes once made */
const planKeywords = new WeakMap<object, ReadonlySet<string>>();

/** The keywords the field's own nodes declare: its seeds and the targets of their `$ref`s, each read as `asTarget()`
 * reads it
 */
function ownKeywords<S extends StrictRJSFSchema>(plan: MergePlan<S>): ReadonlySet<string> {
  const known = planKeywords.get(plan);
  if (known !== undefined) {
    return known;
  }
  const keywords = new Set<string>();
  for (const { node: id, edge } of plan.entries) {
    const node = plan.graph.node(id);
    if ((edge === 'seed' || edge === 'ref') && node.kind === 'schema') {
      Object.keys(asTarget(plan.graph, node).raw).forEach((key) => keywords.add(key));
    }
  }
  planKeywords.set(plan, keywords);
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
interface PlannedField<S extends StrictRJSFSchema> extends OptionPolicy {
  readonly plan: MergePlan<S>;
  readonly optionPolicy?: OptionPolicy;
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
    graph: plan.graph,
    chains: plan.chains,
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
    graph: field.graph,
    chains: ownChains(field.graph, field.seeds),
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

/** What a field is planned from, besides its policies */
interface PlanRequest<S extends StrictRJSFSchema> {
  readonly graph: SchemaGraph<S>;
  readonly seeds: readonly Seed[];
  readonly data: unknown;
  readonly depData: unknown;
  readonly selections: ReadonlyMap<NodeId, number>;
  readonly cutRecursion: boolean;
}

function planWith<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  { graph, seeds, data, depData, selections, cutRecursion }: PlanRequest<S>,
  { allOf, conditions }: OptionPolicy,
  optionPolicy?: OptionPolicy,
): PlannedField<S> {
  const policy = policyFor(context.validator, graph, allOf, conditions, selections, cutRecursion, optionPolicy);
  return { plan: buildPlan<S, F>({ context, graph, seeds, data, depData, policy }), allOf, conditions, optionPolicy };
}

/** Plans a field that is not read whole, under the policies its behavior and its own keywords call for */
function planUnretrieved<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  request: PlanRequest<S>,
): PlannedField<S> {
  const behavior = context.defaultFormStateBehavior;
  const populate = behavior?.allOf === 'populateDefaults';
  if (behavior?.emptyObjectFields !== 'skipEmptyDefaults') {
    return planWith(context, request, { allOf: populate || 'if', conditions: true });
  }
  const withoutConditions = planWith(context, request, { allOf: populate, conditions: false });
  return populate && ownKeywords(withoutConditions.plan).has(ALL_OF_KEY)
    ? planWith(context, request, { allOf: true, conditions: true })
    : withoutConditions;
}

/** Plans `field` for `data` and the dependency data `depData` with the options selected so far, and applies the
 * recursion rule to the plan. A collapsed field that is not within an expansion yet is expanded once, restarting
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
  inherited?: Pick<PlannedField<S>, 'allOf' | 'conditions' | 'optionPolicy'>,
): DefaultsView<S> {
  const { graph } = field;
  if (field.seeds.length === 0) {
    return ownView(field, field.fallback ?? schemaFrom(graph.rawRoot, {}), data);
  }
  // A leaf merges nothing, under any policy, and holds no `$ref` to collapse on, so its plan would be itself
  const leaf = inherited || field.retrieves ? undefined : leafOf(field);
  if (isSchemaObject<S>(leaf)) {
    return ownView(field, leaf, data);
  }
  const planFor = (seeds: readonly Seed[], cutRecursion = false): PlannedField<S> => {
    const fieldData = { graph, seeds, data, depData, selections: options.selections, cutRecursion };
    if (inherited) {
      return planWith(context, fieldData, inherited, inherited.optionPolicy);
    }
    if (field.retrieves) {
      return planWith(context, fieldData, { allOf: true, conditions: true });
    }
    return planUnretrieved(context, fieldData);
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
  // Only the pass whose value is kept reports its `null` fill
  let holdsNull = false;
  const onNullFill = () => {
    holdsNull = true;
  };
  const passProps = { ...props, memo: new Map<string, MemoEntry>(), track, onNullFill };
  const fold = (passView: DefaultsView<S>) => {
    holdsNull = false;
    return foldView(context, passView, passProps);
  };
  let value = fold(view);
  const seen = new Set([qualifiedDependencies(lastView, data)]);
  for (;;) {
    const depData = { ...(isObject(value) ? value : {}), ...(isObject(data) ? data : {}) };
    const qualified = qualifiedDependencies(lastView, depData);
    if (seen.has(qualified)) {
      if (holdsNull) {
        props.onNullFill?.();
      }
      return { value, view };
    }
    seen.add(qualified);
    view = settle(context, field, data, depData);
    value = fold(view);
  }
}

/** The `dependencies` of the field's plan whose keys `depData` holds a value for, as a key equal for equal sets */
function qualifiedDependencies<S extends StrictRJSFSchema>(view: DefaultsView<S>, depData: unknown): string {
  const { graph } = view.field;
  return view.entries
    .flatMap(({ node: id }) => {
      const node = graph.node(id);
      const dependencies: unknown = node.kind === 'schema' ? node.raw.dependencies : undefined;
      const keys = isObject(dependencies) ? Object.keys(dependencies) : [];
      return keys.filter((key) => getByPath(depData, key) !== undefined).map((key) => `${id}:${key}`);
    })
    .join(',');
}

/** The defaults last computed for a field seeded by one leaf subschema, by the subschema, and what they were computed
 * from: such a field reads nothing but its own keywords and its props, and an object field's children are folded again
 * on every edit of any one of them. Only a value that is not an object is kept, so no caller is handed an object
 * another holds.
 */
const leafDefaults = new WeakMap<object, MemoEntry>();

/** The subschema seeding `field` when it is the field's one seed and a leaf */
function leafOf<S extends StrictRJSFSchema>(field: DefaultsField<S>): object | undefined {
  const [seed, ...rest] = field.seeds;
  const node = seed === undefined || rest.length > 0 ? undefined : field.graph.node(seed.node);
  return node?.kind === 'schema' && isLeafSchema(node.raw) ? node.raw : undefined;
}

/** Computes the defaults of the child `child` of a field, memoized across the passes of the field's fixed point, and
 * across calls for a child seeded by a leaf
 */
function foldChild<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  memoKey: string,
  child: DefaultsField<S>,
  props: FoldProps<T, S, F>,
  memo: Map<string, MemoEntry> | undefined,
): unknown {
  const inputs = [
    context,
    child.graph,
    seedsKey(child.seeds),
    child.expanded,
    child.fallback,
    props.parentDefaults,
    props.rawFormData,
    props.required,
    props.requiredAsRoot,
    props.includeUndefinedValues,
    props.initialDefaultsGenerated,
    props.uiSchema,
    props.uiSchemaDefinitions,
    props.shouldMergeDefaultsIntoFormData,
    props.isRenderedOption,
    props.nullFills?.isCollapsed,
  ];
  const leaf = leafOf(child);
  for (const entry of [memo?.get(memoKey), leaf && leafDefaults.get(leaf)]) {
    if (entry?.inputs.every((input, index) => Object.is(input, inputs[index]))) {
      if (entry.holdsNull) {
        props.onNullFill?.();
      }
      return entry.value;
    }
  }
  let holdsNull = false;
  const onNullFill = () => {
    holdsNull = true;
  };
  const { value } = foldField<T, S, F>(context, child, { ...props, memo: undefined, onNullFill });
  if (holdsNull) {
    props.onNullFill?.();
  }
  memo?.set(memoKey, { inputs, value, holdsNull });
  if (leaf !== undefined && (typeof value !== 'object' || value === null)) {
    leafDefaults.set(leaf, { inputs, value, holdsNull });
  }
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
  // Compute the defaults recursively: give highest priority to deepest nodes unless nestedDefaultsPrecedence is ancestorWins.
  let defaults: unknown = parentDefaults;
  const preferParentDefaults =
    defaults !== undefined && defaultFormStateBehavior?.nestedDefaultsPrecedence === 'ancestorWins';
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
    defaults = ownValue(schema[CONST_KEY]);
  } else if (
    isObject(defaults) &&
    isObject(schema.default) &&
    !xxxOf &&
    !isWholeValueSelect<S>(resolveDeclaredConstantOptions<S>(schema, () => view))
  ) {
    // For object defaults, merge defaults by precedence setting.
    // Skip this for anyOf/oneOf schemas, which need special handling, and for a select over object constants,
    // whose own default and inherited default each name a whole constant, so a blend of them names none.
    const ownDefault = ownValue(schema.default);
    defaults = preferParentDefaults ? mergeObjects(ownDefault, defaults) : mergeObjects(defaults, ownDefault);
  } else if (DEFAULT_KEY in schema && !preferParentDefaults && !xxxOf) {
    // If the schema has a default value and parentDefaults does not have precedence
    // And if the schema does not have anyOf or oneOf (since we need to merge the defaults with the formData)
    // Then we should use it as the default.
    defaults = ownValue(schema.default);
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
          rawFormData: Array.isArray(rawFormData) ? rawFormData[idx] : undefined,
          required,
          shouldMergeDefaultsIntoFormData,
          initialDefaultsGenerated,
          uiSchema: getStaticItemsUiSchema<T, S, F>(uiSchema, idx),
          uiSchemaDefinitions,
          nullFills: props.nullFills,
        },
        props.memo,
      ),
    );
  } else if (xxxOf) {
    const choice = chooseOption<S, F>(context, view, xxxOf, rawFormData, defaults, preferParentDefaults);
    isWholeValue = choice.isWholeValue;
    if (choice.wholeOptions === undefined) {
      return foldOption<T, S, F>(choice.context, view, xxxOf, choice.index, { ...props, parentDefaults: defaults });
    }
    // Resolved here rather than by recursing into the option as a primitive select is, since the option's constant is
    // taken as a whole: filling in its properties or items would reduce it to an empty value no option allows. The
    // constant wins over an inherited default, as it does for a primitive `const`, unless constants are never defaults.
    // The `ui:initialValue`/`ui:emptyValue` below still apply, and any form data is kept as it is by `typeDefaults()`
    if (rawFormData === undefined && choice.context.defaultFormStateBehavior?.constAsDefaults !== 'never') {
      defaults = ownValue(toConstant<S>(choice.wholeOptions[choice.index]));
    }
  }

  // No defaults defined for this node, fallback to generic typed ones.
  if (defaults === undefined) {
    defaults = ownValue(schema.default);
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

  const wholeValue = isWholeValue ?? isWholeValueSelect<S>(resolveDeclaredConstantOptions<S>(schema, () => view));
  const defaultBasedOnSchemaType = typeDefaults<T, S, F>(context, view, props, defaults, wholeValue);

  let defaultsWithFormData = defaultBasedOnSchemaType ?? defaults;
  if ((defaultsWithFormData === undefined || defaultsWithFormData === null) && rendersNull(context, view, props)) {
    defaultsWithFormData = null;
    props.onNullFill?.();
  }
  // if shouldMergeDefaultsIntoFormData is true, then merge the defaults into the formData.
  if (shouldMergeDefaultsIntoFormData) {
    const { arrayMinItems = {} } = defaultFormStateBehavior ?? {};
    const { mergeExtraDefaults } = arrayMinItems;

    // An `allOf` merged for the defaults of a field that is not an object is gone from its schema, as it was from the
    // schema `computeDefaults()` recursed into
    const unmergedAllOf = ALL_OF_KEY in schema;
    const mergedAllOf =
      unmergedAllOf ||
      (!view.field.retrieves &&
        view.keywords.has(ALL_OF_KEY) &&
        !(defaultFormStateBehavior?.allOf === 'populateDefaults' && getSchemaType<S>(schema) !== 'object'));
    const foldedType = isObject(rawFormData) ? foldedTypeOf<T, S, F>(view, props, defaults, wholeValue) : undefined;
    if (foldedType !== undefined && foldedType !== 'object') {
      // Object data of a field whose defaults are a whole value or one of another type is the field's value as a whole,
      // so it is kept as it is where the field takes it and its defaults stand otherwise, rather than blended with them
      // key by key
      const matching = viewFormDataMatching<unknown, S, F>(context, view, rawFormData);
      if (matching !== undefined) {
        defaultsWithFormData = matching;
      } else if (wholeValue) {
        defaultsWithFormData = defaults;
      }
    } else if (!isObject(rawFormData) || mergedAllOf) {
      // If the formData is not an object which means it's a primitive field, then we need to merge the defaults into the formData.
      // Or if the schema has allOf, we need to merge the defaults into the formData because we don't compute the defaults for allOf.
      // Where the `allOf` was merged, the properties of object data were computed from it with their data already, so
      // what they were computed as wins over the data here, as an `if`/`then` `const` does. An `allOf` left unmerged
      // computed none of the properties it declares, so the data wins over its defaults
      defaultsWithFormData = mergeDefaultsWithFormData(
        defaultsWithFormData,
        viewFormDataMatching<unknown, S, F>(context, view, rawFormData),
        mergeExtraDefaults,
        true,
        isObject(rawFormData) && !unmergedAllOf,
      );
    }
  }

  return defaultsWithFormData;
}

/** Whether the field of `view` holds the `null` a `null` schema allows as its one value, so a missing value is that
 * value, as is its `default: null`. An option of `type: 'null'` itself is the exception, since `MultiSchemaField`
 * renders no field for it; one that is `null` only through a `type` list renders `NullField`. The type is read off the
 * schema as the field renders it, its `allOf` and `if` merged, and an optional object the Optional Data Controls show
 * collapsed renders none of its fields
 */
function rendersNull<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  { isRenderedOption, nullFills }: FoldProps<T, S, F>,
): boolean {
  if (nullFills?.isCollapsed) {
    return false;
  }
  const { schema } = view;
  const rootSchema = view.graph.rawRoot;
  const rendered =
    (ALL_OF_KEY in schema || IF_KEY in schema) &&
    getSchemaType<S>(schema) === undefined &&
    mayHoldNullType(schema, rootSchema)
      ? retrieveSchema<unknown, S, F>(context, schema, rootSchema, view.data)
      : schema;
  return !(isRenderedOption && rendered.type === 'null') && getSchemaType<S>(rendered) === 'null';
}

/** Returns `value` with every array and plain object in it copied, as `ownValue()` copies a `default`. Anything else,
 * such as a class instance, is the caller's own value and stays as it is, and a proxy over an array or an object, as
 * an observable store holds one, is read through as the data it stands for. A value met twice is copied once.
 */
function copiedValue(value: unknown, copies: WeakMap<object, unknown>): unknown {
  if (!Array.isArray(value) && !isPlainObject(value)) {
    return value;
  }
  const known = copies.get(value);
  if (known !== undefined) {
    return known;
  }
  if (Array.isArray(value)) {
    const copy: unknown[] = new Array<unknown>(value.length);
    copies.set(value, copy);
    value.forEach((item: unknown, index) => {
      copy[index] = copiedValue(item, copies);
    });
    return copy;
  }
  const copy: GenericObjectType = {};
  copies.set(value, copy);
  for (const [key, entry] of Object.entries(value)) {
    setOwn(copy, key, copiedValue(entry, copies));
  }
  return copy;
}

/** Returns a schema's `default` or `const` as the defaults hold it, its arrays and plain objects copied: the schema,
 * which can be the merged schema of a memoized plan, is shared across calls, and the caller may change the defaults it
 * is handed
 */
function ownValue<V>(value: V): V {
  return asDeclared<V>(copiedValue(value, new WeakMap()));
}

/** Picks the option of a field offering `anyOf`/`oneOf` options that its data, or its default, matches, and the context
 * the option's defaults are computed in. Each option is scored where it is declared, or where the merge that rebuilt
 * its list adopted it.
 */
function chooseOption<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  { key, options }: XxxOfOptions<S>,
  rawFormData: unknown,
  defaults: unknown,
  preferParentDefaults: boolean,
): { context: SchemaContext<S, F>; index: number; isWholeValue: boolean; wholeOptions: S[] | undefined } {
  const { defaultFormStateBehavior } = context;
  const { schema } = view;
  const rootSchema = view.graph.rawRoot;
  const { type = 'null' } = withoutKeys(schema, key);
  // An object or array select holds one of its constants as a whole, the way a primitive select does. The options are
  // checked as well, since a non-empty `enum` makes the schema a select whatever they are, and only a constant can be
  // taken whole
  const select = resolveDeclaredConstantOptions<S>(schema, () => view);
  const isWholeValue = isWholeValueSelect<S>(select);
  const constants = getXxxOfOptions<S>(select)?.options;
  const wholeOptions =
    isWholeValue && constants !== undefined && isConstantOptionList<S>(constants, true) ? constants : undefined;
  const picksWholeOption = wholeOptions !== undefined;
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
    ? wholeOptions.findIndex((option) => deepEquals(toConstant<S>(option), valueToMatch))
    : -1;
  const index =
    equalOptionIndex !== -1
      ? equalOptionIndex
      : closestOption<S, F>(
          context,
          rootSchema,
          valueToMatch,
          options,
          0,
          false,
          getDiscriminatorFieldFromSchema<S>(schema),
          { seeding: view, keyword: key },
        );
  return { context: optionContext, index, isWholeValue, wholeOptions };
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
  const branchProps = {
    ...props,
    uiSchema: getOptionUiSchema<T, S, F>(props.uiSchema, key, index),
    isRenderedOption: true,
  };
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
    // The options are not a list the plan met as it stands, such as the cross product a merge makes of two lists, one
    // a `customMergeAllOf` copied or one a `dependencies` entry brings, which the plan merges without offering. So the
    // option is read as written and the field computed from it. It is still the same field, reached the same way: it
    // keeps its edge, and the longest ref path a node of its plan holding such a list was entered with, or a recursion
    // through the option would start afresh at every level
    const listed: unknown = options[index];
    const option = schemaFrom(rootSchema, listed);
    // The option is read where it is declared, or where the merge rebuilding its list adopted it, so that its `$ref`s
    // resolve in the resource it sits in
    const offered = isSchemaObject<S>(listed) ? offeredOption<S>(view, key, index, listed) : undefined;
    const declared = offered?.graph.node(offered.node);
    const rendered = rendersOwnField
      ? mergeSchemas(remaining, option)
      : withDefaultOf(
          remaining,
          getRenderedOptionSchema<S>(
            remaining,
            offered === undefined
              ? option
              : resolveMergedOwnRef<S>(
                  offered.graph,
                  [{ node: offered.node, refPath: [] }],
                  option,
                  context.customMergeAllOf,
                ),
          ),
        );
    const adopted = graph.adopt(
      schemaFrom(rootSchema, rendered),
      declared?.kind === 'schema' ? declared.outerBase : undefined,
    );
    const offeredAt = view.entries
      .filter(({ node: id }) => {
        const node = graph.node(id);
        return node.kind === 'schema' && Array.isArray(Reflect.get(node.raw, key));
      })
      .reduce<RefPath>((longest, { refPath }) => (refPath.length > longest.length ? refPath : longest), []);
    const optionField: DefaultsField<S> = {
      ...field,
      graph: adopted.graph,
      seeds: [{ node: adopted.node, refPath: offeredAt }],
    };
    const optionView = settle(context, optionField, view.data, view.depData);
    return foldView<T, S, F>(context, { ...optionView, options: { ...optionView.options, chosen } }, branchProps);
  }
  const optionNode = choice.options[index];
  const selections = new Map(view.options.selections).set(choice.provider, index);
  // A field read whole merges its own `allOf` and `if`, but its option is read as the same option under a property is
  const optionPolicy = field.retrieves
    ? planUnretrieved(context, {
        graph,
        seeds: field.seeds,
        data: view.data,
        depData: view.depData,
        selections: NO_OPTIONS.selections,
        cutRecursion: false,
      })
    : undefined;
  // The option is merged into the field, so its own `if` and `allOf` count as the field's: an `if` merges the
  // `allOf`s under the `'if'` policy, and an `allOf` merged under `allOf: 'populateDefaults'` takes its `then`/`else`
  // under `skipEmptyDefaults`
  const optionDeclares = (keyword: string) => declaresKeyword(graph, optionNode, keyword);
  const inherited = {
    allOf: view.allOf === 'if' && optionDeclares(IF_KEY) ? true : view.allOf,
    conditions:
      view.conditions || (context.defaultFormStateBehavior?.allOf === 'populateDefaults' && optionDeclares(ALL_OF_KEY)),
    optionPolicy: optionPolicy && { allOf: optionPolicy.allOf, conditions: optionPolicy.conditions },
  };
  // The rule applies to the field with its option merged, since a recursion through an option enters its `$ref` only
  // there: the option collapses where the same recursion written as a property does, whatever the data holds below it
  const merged = settle(context, field, view.data, view.depData, { selections, chosen }, inherited);
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
    policy: policyFor(
      context.validator,
      graph,
      inherited.optionPolicy?.allOf ?? view.allOf,
      inherited.optionPolicy?.conditions ?? view.conditions,
      NO_OPTIONS.selections,
      merged.collapsed,
    ),
  });
  const rendered = getRenderedOptionSchema<S>(remaining, optionAlone.schema);
  return foldView<T, S, F>(
    context,
    { ...merged, schema: schemaFrom(rootSchema, withDefaultOf(remaining, rendered)) },
    branchProps,
  );
}

/** Returns the array item `getInnerSchemaForArrayItem()` picks for `additionalItems` and `idx`: its seeds, the edge it
 * is reached through, and the subschema that function returns for it
 */
function innerItem<S extends StrictRJSFSchema>(
  view: DefaultsView<S>,
  additionalItems: AdditionalItemsHandling,
  idx: number,
): { seeds: readonly Seed[]; edge: ContainmentEdge; fallback: unknown } {
  const { items, additionalItems: additional } = view.schema;
  if (idx >= 0) {
    if (Array.isArray(items) && idx < items.length && typeof items[idx] !== 'boolean') {
      return { seeds: tupleSeeds(view, idx), edge: 'tupleItem', fallback: items[idx] };
    }
  } else if (items && !Array.isArray(items) && typeof items !== 'boolean') {
    return { seeds: seedsAt(view, 'items'), edge: 'item', fallback: items };
  }
  if (additionalItems !== AdditionalItemsHandling.Ignore && isObject(additional)) {
    return { seeds: seedsAt(view, 'additionalItems'), edge: 'item', fallback: additional };
  }
  return { seeds: [], edge: 'item', fallback: {} };
}

/** The `null` fills to compute the defaults of a property of an object with: `nullFills` itself, or, for an optional
 * object the Optional Data Controls render while it has no value, a copy marked collapsed, see `NullFills.isCollapsed`.
 * No value is what the controls read as none: an empty object counts, as `undefined` and `null` do. Asked of the
 * uiSchema the field renders with, the `ui:definitions` entry of a definition the property references merged in, as
 * `foldView()` merges it for the property's own field
 *
 * @param context - The `SchemaContext` the defaults are computed in
 * @param child - The property's field
 * @param propertySchema - The property's schema as the object declares it
 * @param props - The property's own uiSchema, the `ui:definitions`, the call's `nullFills`, whether the object requires
 *        the property, and the property's form data
 * @returns - The `null` fills for the property
 */
function nullFillsForProperty<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  child: DefaultsField<S>,
  propertySchema: S,
  {
    uiSchema,
    uiSchemaDefinitions,
    nullFills,
    isRequired,
    formData,
  }: Pick<FoldProps<T, S, F>, 'uiSchema' | 'uiSchemaDefinitions' | 'nullFills'> & {
    isRequired?: boolean;
    formData: unknown;
  },
): NullFills | undefined {
  const rootSchema = child.graph.rawRoot;
  const isCollapsed =
    nullFills !== undefined &&
    !nullFills.isCollapsed &&
    !isRequired &&
    !isFormDataAvailable(formData) &&
    mayHoldNullType(propertySchema, rootSchema) &&
    isOptionalDataControlsType<T, S, F>(
      () => settle(context, { ...child, retrieves: true }, undefined, undefined).schema,
      uiSchemaDefinitions
        ? resolveUiSchema<T, S, F>(propertySchema, uiSchema, { rootSchema, uiSchemaDefinitions })
        : uiSchema,
      nullFills.globalUiOptions,
      rootSchema,
    );
  return isCollapsed ? { ...nullFills, isCollapsed } : nullFills;
}

/** Returns the child of an array field at the item `getInnerSchemaForArrayItem()` picks */
function itemField<S extends StrictRJSFSchema>(
  view: DefaultsView<S>,
  additionalItems: AdditionalItemsHandling,
  idx = -1,
): DefaultsField<S> {
  const { seeds, edge, fallback } = innerItem(view, additionalItems, idx);
  return defaultsChild(view, seeds, edge, fallback);
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
    onNullFill,
    nullFills,
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
  const childProps = (key: string, uiSchemaKey: string) => ({
    includeUndefinedValues: includeUndefinedValues === true,
    parentDefaults: getByPath(defaults, key),
    rawFormData: getByPath(formData, key),
    required: schema.required?.includes(key),
    shouldMergeDefaultsIntoFormData,
    initialDefaultsGenerated,
    uiSchema: getByPath<UiSchema<T, S, F> | undefined>(uiSchema, uiSchemaKey),
    uiSchemaDefinitions,
    nullFills,
  });
  // Computes a child's defaults, reporting whether they hold a `null` fill
  const foldReporting = (
    childContext: SchemaContext<S, F>,
    memoKey: string,
    child: DefaultsField<S>,
    childFoldProps: FoldProps<T, S, F>,
  ) => {
    let holdsNull = false;
    const value = foldChild<T, S, F>(
      childContext,
      memoKey,
      child,
      {
        ...childFoldProps,
        onNullFill: () => {
          holdsNull = true;
        },
      },
      memo,
    );
    return { value, holdsNull };
  };
  for (const key of Object.keys(schema.properties ?? {})) {
    const propertySchema = getPropertySchema<S>(schema, key);
    const { seeds, edge } = childSeeds(view, key);
    // A property written as a `$ref` keeps its `const` and `type` in the definition it names, which is read where the
    // declaration holding that `$ref` sits, since a property declared twice is merged into one no graph holds
    const readProperty = isSchemaObject<S>(propertySchema)
      ? resolveMergedOwnRef<S>(view.graph, seeds, propertySchema, context.customMergeAllOf)
      : propertySchema;
    // Check if the parent schema has a const property defined AND we are supporting const as defaults, then we
    // should always return the computedDefault since it's coming from the const.
    const hasParentConst = getByPath(parentConst, key) !== undefined;
    const hasConst =
      ((isObject(readProperty) && CONST_KEY in readProperty) || hasParentConst) &&
      defaultFormStateBehavior?.constAsDefaults !== 'never' &&
      !constIsAjvDataReference(readProperty);
    // A property stubbed by `stubExistingAdditionalProperties()` from `additionalProperties`/`patternProperties`
    // (flagged here, same as ObjectField's own rendering) shares `uiSchema.additionalProperties` with every other such
    // property, rather than a dynamically-named entry.
    const addedByAdditionalProperty =
      isObject(propertySchema) && Boolean(Reflect.get(propertySchema, ADDITIONAL_PROPERTY_FLAG));
    const child = defaultsChild(view, seeds, edge, propertySchema);
    const ownProps = childProps(key, addedByAdditionalProperty ? ADDITIONAL_PROPERTIES_KEY : key);
    // An optional object the Optional Data Controls render while it has no value renders none of its fields, so the
    // `null` of none of them is filled in until the user adds it
    const propertyNullFills = nullFillsForProperty<T, S, F>(context, child, propertySchema, {
      uiSchema: ownProps.uiSchema,
      uiSchemaDefinitions,
      nullFills,
      isRequired: ownProps.required,
      formData: ownProps.rawFormData,
    });
    // Compute the defaults for this node, with the parent defaults we might have from a previous run: defaults[key].
    let property = foldReporting(
      context,
      propertyNullFills === nullFills ? `property:${key}` : `collapsed:${key}`,
      child,
      { ...ownProps, nullFills: propertyNullFills },
    );
    if (propertyNullFills !== nullFills) {
      // Its own defaults can add it all the same, and an object added with a value renders its fields, whose `null`s
      // it then holds, as it does once the user adds it
      const added: GenericObjectType = {};
      maybeAddDefaultToObject(
        added,
        key,
        property.value,
        includeUndefinedValues,
        required,
        schema.required,
        defaultFormStateBehavior?.emptyObjectFields,
        hasConst,
      );
      if (isFormDataAvailable(added[key])) {
        property = foldReporting(context, `property:${key}`, child, ownProps);
      }
    }
    if (property.holdsNull) {
      fillOverUndefined(nullFills, rawFormData, key, property.value);
    }

    maybeAddDefaultToObject(
      computed,
      key,
      property.value,
      includeUndefinedValues,
      required,
      schema.required,
      defaultFormStateBehavior?.emptyObjectFields,
      hasConst,
      property.holdsNull,
    );
    if (property.holdsNull) {
      onNullFill?.();
    }
  }
  // An `allOf` or `if` the field's plan left unmerged still brings its properties into the field rendered for it
  if (
    !view.field.retrieves &&
    (ALL_OF_KEY in view.schema || IF_KEY in view.schema) &&
    mayHoldNullType(view.schema, rootSchema)
  ) {
    branchNullFills<T, S, F>(context, view, schema, props, foldReporting).forEach(({ key, value }) => {
      setOwn(computed, key, value);
      fillOverUndefined(nullFills, rawFormData, key, value);
      onNullFill?.();
    });
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
      .filter((key) => !schema.properties || !Object.hasOwn(schema.properties, key))
      .forEach((key) => {
        keys.add(key);
        formDataRequired.push(key);
      });
    // Only seed keys from schema defaults when formData has no additionalProperties of its own.
    // If the user already has data (e.g. after a key rename), injecting default keys would
    // re-add stale entries that no longer exist in formData.
    if (isObject(defaults) && formDataRequired.length === 0) {
      Object.keys(defaults)
        .filter((key) => !schema.properties || !Object.hasOwn(schema.properties, key))
        .forEach((key) => keys.add(key));
    }
    keys.forEach((key) => {
      const { value, holdsNull } = foldReporting(
        context,
        `additional:${key}`,
        defaultsChild(view, seedsAt(view, ADDITIONAL_PROPERTIES_KEY), 'additionalKey', additionalPropertiesSchema),
        // Matches ObjectField's convention for properties added by `additionalProperties`: they all share
        // `uiSchema.additionalProperties` rather than each having its own dynamically-named entry in `uiSchema`.
        childProps(key, ADDITIONAL_PROPERTIES_KEY),
      );
      // Added whatever the form's settings say, below, so its `null` only has to reach the objects above
      if (holdsNull) {
        fillOverUndefined(nullFills, rawFormData, key, value);
        onNullFill?.();
      }
      maybeAddDefaultToObject(
        computed,
        key,
        value,
        includeUndefinedValues,
        required,
        formDataRequired,
        // A property added by `additionalProperties` is one the user added, so it is populated whatever the form's
        // `emptyObjectFields` says about the properties the schema names
        'populateAllDefaults',
      );
    });
  }
  // Once the form has generated its defaults, the additional properties the data holds keep the values the user left
  // them (#3759), except for the `null` the field of a `null` schema holds, which is filled in for them as it is for
  // the properties the schema names
  if (
    initialDefaultsGenerated &&
    isSchemaObject<S>(additionalProperties) &&
    mayHoldNullType(additionalProperties, rootSchema)
  ) {
    const nullsOnly = nullsOnlyContext(context);
    const child = defaultsChild(view, seedsAt(view, ADDITIONAL_PROPERTIES_KEY), 'additionalKey', additionalProperties);
    Object.keys(formData)
      .filter((key) => !schema.properties || !Object.hasOwn(schema.properties, key))
      .forEach((key) => {
        const { value, holdsNull } = foldReporting(nullsOnly, `additionalNull:${key}`, child, {
          rawFormData: getByPath(formData, key),
          initialDefaultsGenerated,
          uiSchema: getByPath<UiSchema<T, S, F> | undefined>(uiSchema, ADDITIONAL_PROPERTIES_KEY),
          uiSchemaDefinitions,
          nullFills,
        });
        if (holdsNull) {
          setOwn(computed, key, value);
          fillOverUndefined(nullFills, rawFormData, key, value);
          onNullFill?.();
        }
      });
  }
  return computeDefaultBasedOnSchemaTypeAndDefaults<unknown, S>(view.schema, computed);
}

/** The `null` a missing value of a `null` schema is filled in as, for each property an `allOf` or `if` of the object
 * field `view` brings in that its plan left unmerged, and each of its own properties a branch makes `null`. The field
 * rendered for such a property renders all the same, from the schema `SchemaField` retrieves, and a `null` schema's one
 * value is the value it holds, so that `null` is added, with the objects that lead to it, and nothing else the
 * branches would default.
 *
 * @param context - The `SchemaContext` the defaults are computed in
 * @param view - The object field's view
 * @param schema - The object's schema, its extra keys stubbed where the field stubs them
 * @param props - The props of the object field
 * @param foldReporting - Computes a child's defaults, reporting whether they hold a `null` fill
 * @returns - The defaults of those properties that hold such a `null`
 */
function branchNullFills<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  schema: S,
  { rawFormData, uiSchema, uiSchemaDefinitions, nullFills }: FoldProps<T, S, F>,
  foldReporting: (
    childContext: SchemaContext<S, F>,
    memoKey: string,
    child: DefaultsField<S>,
    childFoldProps: FoldProps<T, S, F>,
  ) => { value: unknown; holdsNull: boolean },
): { key: string; value: unknown }[] {
  const formData = isObject(rawFormData) ? rawFormData : {};
  const retrieved = settle(context, { ...view.field, retrieves: true }, view.data, view.depData, view.options);
  const rendered = allowsAdditionalProperties<S>(retrieved.schema)
    ? stubExistingAdditionalProperties<unknown, S, F>(context, retrieved.schema, view.graph.rawRoot, formData)
    : retrieved.schema;
  const nullsOnly = nullsOnlyContext(context);
  const ownProperties = schema.properties ?? {};
  return Object.keys(rendered.properties ?? {})
    .filter(
      (key) =>
        !Object.hasOwn(ownProperties, key) ||
        (getSchemaType<S>(getPropertySchema<S>(rendered, key)) === 'null' &&
          getSchemaType<S>(getPropertySchema<S>(schema, key)) !== 'null'),
    )
    .flatMap((key) => {
      const propertySchema = getPropertySchema<S>(rendered, key);
      const { seeds, edge } = childSeeds(retrieved, key);
      const child = defaultsChild(retrieved, seeds, edge, propertySchema);
      const propertyFormData = getByPath(formData, key);
      // As the properties the object names read theirs, an additional property the retrieve stubbed sharing one entry
      const propertyUiSchema = getByPath<UiSchema<T, S, F> | undefined>(
        uiSchema,
        isObject(propertySchema) && Reflect.get(propertySchema, ADDITIONAL_PROPERTY_FLAG) === true
          ? ADDITIONAL_PROPERTIES_KEY
          : key,
      );
      const { value, holdsNull } = foldReporting(nullsOnly, `branch:${key}`, child, {
        rawFormData: propertyFormData,
        uiSchema: propertyUiSchema,
        uiSchemaDefinitions,
        // An optional object the Optional Data Controls render while it has no value is left out with its `null`s, as
        // one the object names is: under these settings nothing else could add it
        nullFills: nullFillsForProperty<T, S, F>(context, child, propertySchema, {
          uiSchema: propertyUiSchema,
          uiSchemaDefinitions,
          nullFills,
          isRequired: rendered.required?.includes(key),
          formData: propertyFormData,
        }),
      });
      return holdsNull ? [{ key, value }] : [];
    });
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

/** Returns the schema of the array field `view` with an `items` written as a `$ref` read as the definition it names,
 * where the declaration holding that `$ref` sits, which is what a `computeSkipPopulate()` reading the items' keywords
 * expects to be handed
 */
function withItemsResolved<S extends StrictRJSFSchema>(
  view: DefaultsView<S>,
  customMergeAllOf: CustomMergeAllOf<S> | undefined,
): S {
  const { schema } = view;
  const { items } = schema;
  const resolved = isSchemaObject<S>(items)
    ? resolveMergedOwnRef<S>(view.graph, seedsAt(view, 'items'), items, customMergeAllOf)
    : items;
  return resolved === items ? schema : { ...schema, items: resolved };
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
    onNullFill,
    nullFills,
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
    nullFills,
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
          // An item the data holds is one a field renders
          onNullFill: Array.isArray(rawFormData) && idx < rawFormData.length ? onNullFill : undefined,
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
          // An item the data holds is one a field renders
          { ...itemProps(idx), rawFormData: item, parentDefaults: getByPath(defaults, idx), onNullFill },
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
  const withItems = schema.minItems ? withItemsResolved(view, context.customMergeAllOf) : schema;
  if (
    !schema.minItems ||
    isMultiSelect<T, S, F>(context, withItems, rootSchema) ||
    computeSkipPopulate<S, F>(context, withItems, rootSchema) ||
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
        { ...itemProps(defaultsLength + i), parentDefaults: fillerDefault, nullFills: undefined },
        memo,
      ),
    );
    // then fill up the rest with either the item default or empty, up to minItems
    arrayDefault = defaultEntries.concat(fillerEntries);
  }

  return computeDefaultBasedOnSchemaTypeAndDefaults<unknown, S>(schema, arrayDefault);
}

/** How a field's defaults are computed: `'whole'` for a select over object or array constants, which holds one of
 * them as a whole, the field type `SchemaField` renders it as otherwise, or `undefined` for a `type` list holding, or
 * defaulting to, a value of another listed type than the object or array it renders, which is left as it is.
 *
 * @param view - The field's view
 * @param props - The props of the field
 * @param defaults - The defaults computed for the field so far
 * @param isWholeValue - Whether the field is a select over whole object or array values
 * @returns - The kind of value the field's defaults are computed as
 */
function foldedTypeOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  view: DefaultsView<S>,
  { uiSchema, rawFormData }: FoldProps<T, S, F>,
  defaults: unknown,
  isWholeValue: boolean,
): string | undefined {
  // A select over object or array constants picks one of them as a whole, so it has no contents of its own to fill in,
  // and an empty object or array would be a value none of its options allow
  if (isWholeValue) {
    return 'whole';
  }
  // A `ui:widget` that `SchemaField` renders through another listed type's field takes that type's default, so a
  // required `['null', 'boolean', 'string']` shown as a `textarea` isn't seeded with a `false` the textarea can't show
  const { schema } = view;
  const type = getFieldTypeForUiSchema<T, S, F>(schema, uiSchema);
  // A value of another type a `type` list names is left as it is, as `omitExtraData()` and
  // `getUiRequiredErrorSchema()` leave it: an object held by a `['null', 'array', 'object']` has no array items spread
  // into it, and a `null` held by a `['null', 'object']` is not filled in with the object's defaults. With no value,
  // a default of another listed type is kept the same way, so a `default: 'abc'` on a `['null', 'object', 'string']`
  // isn't replaced by the object's. A `null` default is left to `computeDefaultBasedOnSchemaTypeAndDefaults()`
  const value = rawFormData === undefined && defaults !== null ? defaults : rawFormData;
  if (
    Array.isArray(schema.type) &&
    (type === 'object' || type === 'array') &&
    getSchemaTypeForValue<S>(schema, value) !== type
  ) {
    return undefined;
  }
  return type;
}

/** Computes the default value based on the schema type.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param view - The field's view
 * @param props - The props of the field
 * @param defaults - The defaults computed for the field so far
 * @param isWholeValue - Whether the field is a select over whole object or array values
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
function typeDefaults<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  props: FoldProps<T, S, F>,
  defaults: unknown,
  isWholeValue: boolean,
): unknown {
  const type = foldedTypeOf<T, S, F>(view, props, defaults, isWholeValue);
  // A value already picked is kept as it is, since the form data is merged over the defaults key by key, which would
  // blend it with the default constant
  if (type === 'whole') {
    // A `null` value is one the user picked, so only a missing one falls back to the default
    return props.rawFormData === undefined ? defaults : props.rawFormData;
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
 * `rootSchema`. A subschema `retrieveSchema()` handed out is the field it was handed out for, so its `$ref`s resolve in
 * the resource it sits in, as retrieving it resolves them; its ref path restarts all the same
 */
function callRoot<S extends StrictRJSFSchema>(rootSchema: S | undefined, rawSchema: S): DefaultsField<S> {
  const { graph, seeds } = fieldOf<S>(parseSchemaGraph<S>(rootSchema ?? schemaFrom(rawSchema, {})), rawSchema);
  return { graph, seeds: restartSeeds(seeds), expanded: false, edge: 'root' };
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
  const retrieves = stubsFor(context, field, new Set(Object.keys(rawSchema)));
  return retrieves
    ? settle<S, F>(context, { ...field, retrieves }, rawFormData, rawFormData)
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
>(
  context: SchemaContext<S, F>,
  rawSchema: S,
  inputProps: ComputeDefaultsProps<T, S, F> = {},
): T | T[] | null | undefined {
  const field = callRoot<S>(inputProps.rootSchema, rawSchema);
  return asDeclared<T | T[] | null | undefined>(foldField<T, S, F>(context, field, inputProps).value);
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
    typeDefaults<T, S, F>(
      context,
      view,
      computeDefaultsProps,
      defaults,
      isWholeValue ?? isWholeValueSelect<S>(resolveDeclaredConstantOptions<S>(view.schema, () => view)),
    ),
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
  const field = () => fieldOf<S>(parseSchemaGraph<S>(rootSchema), schema);
  const chains = () => {
    const { graph, seeds } = field();
    return ownChains(graph, seeds);
  };
  return formDataMatching<T, S, F>(context, { schema, field, chains }, rootSchema, formData);
}

/** `ensureFormDataMatchingSchema()` for the field `view` the fold computed. Its schema holds the options the fold
 * selected for it, so the field it is retrieved as is seeded by them too, each merged over the field's own seeds as the
 * fold merged it
 */
function viewFormDataMatching<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  formData: T | undefined,
): T | T[] | undefined {
  let provenance: Provenance<S> | undefined;
  const field = () => {
    provenance ??= rootProvenance<S>(view.graph, [
      ...view.field.seeds,
      ...view.choices.flatMap(({ provider, options, refPath }): Seed[] => {
        const index = view.options.selections.get(provider);
        return index === undefined ? [] : [{ node: options[index], refPath, scope: [`o${options[index]}`] }];
      }),
    ]);
    return provenance;
  };
  return formDataMatching<T, S, F>(
    context,
    { schema: view.schema, field, chains: () => view.chains },
    view.graph.rawRoot,
    formData,
  );
}

/** A schema the data is matched to, and the field it is the schema of, from whose declarations it is retrieved and its
 * properties read: a schema merged from declarations in several resources holds subschemas no graph holds, which
 * reading it as a call root would resolve against the root's base
 */
interface MatchedSchema<S extends StrictRJSFSchema> {
  readonly schema: S;
  readonly field: () => Provenance<S>;
  /** The chains the properties of `schema` are declared in */
  readonly chains: () => readonly Keywords<S>[];
}

/** Whether `value` is an object as JSON Schema reads data: a plain object with no primitive value of its own. One whose
 * `valueOf()` gives a primitive, as a moment, dayjs or Luxon object's gives an epoch, is that value to the date widgets
 * `utcToLocal()` converts it for
 */
function isObjectData(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && Reflect.get(value, 'valueOf') === Object.prototype.valueOf;
}

/** Whether `schema` takes an object as its value: it names `object` among the types it says its value has, or says
 * nothing about them, as a schema with no `type` of its own whose `anyOf` options or `default` would say
 */
function takesObject<S extends StrictRJSFSchema>(schema: S): boolean {
  const types = getSchemaOwnTypes<S>(schema);
  return types === undefined || types.includes('object');
}

/** Returns `formData` matched to `matched.schema` as `ensureFormDataMatchingSchema()` matches it */
function formDataMatching<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  { schema, field, chains }: MatchedSchema<S>,
  rootSchema: S,
  formData: T | undefined,
): T | T[] | undefined {
  const { defaultFormStateBehavior } = context;
  const shouldRetrieveAllOf = shouldPopulateAllOfDefaults(schema, defaultFormStateBehavior);
  const schemaToMatch = shouldRetrieveAllOf ? retrieveField<S, F>(context, field(), formData) : schema;
  let declaredIn: Seeding<S> | undefined;
  const declarations = () => {
    declaredIn ??= { graph: field().graph, chains: chains() };
    return declaredIn;
  };
  // Without data there is nothing to check against the options of a select, so only data asks whether it is one. A
  // schema with nothing left to merge is asked as it stands, which is what retrieving it would give
  const isSelectField =
    formData !== undefined &&
    !isConstant<S>(schemaToMatch) &&
    isConstantSelect<S>(
      resolveDeclaredConstantOptions<S>(
        MERGING_KEYWORDS.some((keyword) => Object.hasOwn(schemaToMatch, keyword))
          ? retrieveField<S, F>(context, field())
          : schemaToMatch,
        declarations,
      ),
      true,
    );
  let validFormData: unknown = formData;
  if (isSelectField) {
    const getOptionsList = optionsList<T, S, F>(resolveDeclaredConstantOptions<S>(schemaToMatch, declarations));
    // An empty option list has no value to check the data against, so the data is kept, as it is without the list
    if (getOptionsList?.length !== 0) {
      validFormData = getOptionsList?.some((option) => deepEquals(option.value, formData)) ? formData : undefined;
    }
  } else if (isObjectData(formData) && !takesObject<S>(schemaToMatch)) {
    // Object data can never validate against a schema whose types leave out `object`, so it is no value of the field
    validFormData = undefined;
  }

  // Override the formData with the const if the constAsDefaults is set to always
  const constTakesPrecedence = schemaToMatch[CONST_KEY] && defaultFormStateBehavior?.constAsDefaults === 'always';
  if (constTakesPrecedence) {
    validFormData = schemaToMatch.const;
  } else if (isObject(validFormData) && isObject(schemaToMatch.properties)) {
    const matched: GenericObjectType = { ...validFormData };
    const rootGraph = parseSchemaGraph<S>(rootSchema);
    // A property `retrieveSchema()` handed out is the field it was handed out for, and any other is declared where the
    // declarations of the schema holding it declare it
    const fieldOfProperty = (key: string, propertySchema: S): Provenance<S> => {
      let declared: readonly Seed[] = [];
      if (readProvenance<S>(propertySchema, rootGraph) === undefined) {
        declared = seedsAt(declarations(), PROPERTIES_KEY, key);
      }
      return declared.length > 0 ? rootProvenance<S>(field().graph, declared) : fieldOf<S>(rootGraph, propertySchema);
    };
    for (const key of Object.keys(schemaToMatch.properties)) {
      const propertySchema = getPropertySchema<S>(schemaToMatch, key);
      const propertyField = () => fieldOfProperty(key, propertySchema);
      // A property written as a `$ref` is matched as the definition it names, whose `allOf` it is
      let readProperty = propertySchema;
      if (isSchemaObject<S>(propertySchema) && typeof propertySchema[REF_KEY] === 'string') {
        const { graph, seeds } = propertyField();
        readProperty = resolveMergedOwnRef<S>(graph, seeds, propertySchema, context.customMergeAllOf);
      }
      const retrievesProperty = shouldRetrieveAllOf || (isObject(readProperty) && ALL_OF_KEY in readProperty);
      // Object data is matched at every depth, so a value nested in it that its schema can't take is found too
      if (Object.hasOwn(matched, key) && (retrievesProperty || isObjectData(matched[key]))) {
        const chainsOfProperty = () => {
          const { graph, seeds } = propertyField();
          return buildPlan<S, F>({ context, graph, seeds, policy: { allOf: false, conditions: false } }).chains;
        };
        const matchedProperty = formDataMatching<unknown, S, F>(
          context,
          { schema: readProperty, field: propertyField, chains: chainsOfProperty },
          rootSchema,
          matched[key],
        );
        // Object data that doesn't match is left out, so the property takes its defaults as one the data lacks does
        if (matchedProperty === undefined && !retrievesProperty) {
          Reflect.deleteProperty(matched, key);
        } else {
          setOwn(matched, key, matchedProperty);
        }
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
): T | T[] | null | undefined {
  if (!isObject(theSchema)) {
    throw new Error(`Invalid schema: ${String(theSchema)}`);
  }
  const root = rootSchema ?? theSchema;
  // The root is resolved as `retrieveSchema()` resolves it, its `allOf` merged and the extra keys of its data stubbed
  const field: DefaultsField<S> = { ...callRoot<S>(root, theSchema), retrieves: true };
  // Get the computed defaults with 'shouldMergeDefaultsIntoFormData' set to true to merge defaults into formData.
  // This is done when for example the value from formData does not exist in the schema 'enum' property, in such
  // cases we take the value from the defaults because the value from the formData is not valid.
  const nullFills: NullFills = {
    globalUiOptions: getByPath<GlobalUISchemaOptions | undefined>(uiSchema, UI_GLOBAL_OPTIONS_KEY),
    overUndefined: new Map(),
  };
  const { value: defaults, view } = foldField<T, S, F>(context, field, {
    nullFills,
    includeUndefinedValues,
    rawFormData: formData,
    shouldMergeDefaultsIntoFormData: true,
    initialDefaultsGenerated,
    requiredAsRoot: true,
    uiSchema,
    uiSchemaDefinitions,
  });
  const { schema } = view;
  const matchingFormData: unknown =
    isObject(formData) || Array.isArray(formData) ? viewFormDataMatching<T, S, F>(context, view, formData) : undefined;

  // Array form data takes the merge path below, which knows how to combine it with the defaults
  if (schema.type !== 'object' && isObject(schema.default) && isObject(defaults) && !Array.isArray(formData)) {
    return asDeclared<T>(
      withNullFills(
        {
          ...defaults,
          ...(isObject(matchingFormData) ? matchingFormData : undefined),
        },
        formData,
        nullFills,
      ),
    );
  }

  // If the formData is an object or an array, add additional properties from formData and override formData with
  // defaults since the defaults are already merged with formData.
  if (isObject(formData) || Array.isArray(formData)) {
    const { mergeDefaultsIntoFormData } = context.defaultFormStateBehavior ?? {};
    const defaultSupercedesUndefined = mergeDefaultsIntoFormData === 'useDefaultIfFormDataUndefined';
    // Data the schema can't take is no value at all, so the defaults stand alone
    if (matchingFormData === undefined) {
      return asDeclared<T | T[] | null | undefined>(defaults);
    }
    return asDeclared<T | T[] | null | undefined>(
      withNullFills(
        mergeDefaultsWithFormData(
          defaults,
          matchingFormData,
          true, // set to true to add any additional default array entries.
          defaultSupercedesUndefined,
          true, // set to true to override formData with defaults if they exist.
        ),
        formData,
        nullFills,
      ),
    );
  }

  return asDeclared<T | T[] | null | undefined>(defaults);
}
