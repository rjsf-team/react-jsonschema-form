import {
  absentKeywordAllows,
  additionalPropertiesKeywordName,
  allowsAdditionalProperties,
  getAdditionalPropertySchema,
} from '../additionalPropertiesUtils.ts';
import {
  ADDITIONAL_ITEMS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  ANY_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  ENUM_KEY,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  THEN_KEY,
  UI_DEFINITIONS_KEY,
  UI_GLOBAL_OPTIONS_KEY,
} from '../constants.ts';
import constIsAjvDataReference from '../constIsAjvDataReference.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getOptionUiSchema, { withoutFieldOptions } from '../getOptionUiSchema.ts';
import getPropertySchema from '../getPropertySchema.ts';
import { renderOption } from '../getRenderedOptionSchema.ts';
import getRenderedOptionUiSchema from '../getRenderedOptionUiSchema.ts';
import getSchemaOwnTypes from '../getSchemaOwnTypes.ts';
import getSchemaType from '../getSchemaType.ts';
import getSchemaTypeForValue from '../getSchemaTypeForValue.ts';
import getStaticItemsUiSchema from '../getStaticItemsUiSchema.ts';
import getUiOptions from '../getUiOptions.ts';
import { getFieldTypeForUiSchema } from '../getWidget.tsx';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import type { XxxOfOptions } from '../getXxxOfOptions.ts';
import hasSchemaMarker from '../hasSchemaMarker.ts';
import isConstant from '../isConstant.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import isConstantSelect from '../isConstantSelect.ts';
import isFormDataAvailable from '../isFormDataAvailable.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import isPlainObject from '../isPlainObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import mergeDefaultsWithFormData from '../mergeDefaultsWithFormData.ts';
import mergeObjects from '../mergeObjects.ts';
import mergeSchemas from '../mergeSchemas.ts';
import optionsList from '../optionsList.ts';
import { getByPath, hasByPath } from '../pathUtils.ts';
import rendersOwnFieldBesideOption from '../rendersOwnFieldBesideOption.ts';
import replaceEqualDeep from '../replaceEqualDeep.ts';
import resolveUiSchema from '../resolveUiSchema.ts';
import setOwn from '../setOwn.ts';
import { isCollapsedByOptionalDataControls } from '../shouldRenderOptionalField.ts';
import toConstant from '../toConstant.ts';
import type {
  CustomMergeAllOf,
  DefaultFormStateBehavior,
  FieldFill,
  FieldPathList,
  FormContextType,
  FormFieldState,
  GenericObjectType,
  GetDefaultFormStateProps,
  GlobalUISchemaOptions,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  UiSchema,
} from '../types.ts';
import fieldShownOption, {
  rebuiltOptionPick,
  rendersOptionsAsSelect,
  seedsWrittenList,
  writtenOptionIndices,
} from './fieldShownOption.ts';
import { closestOption } from './getClosestMatchingOption.ts';
import { typeAllows } from './getFirstMatchingOption.ts';
import { AdditionalItemsHandling, getInnerSchemaForArrayItem } from './getInnerSchemaForArrayItem.ts';
import {
  getItemSchema,
  getOpenPrefixLength,
  getPrefixLength,
  getRestItemsKey,
  isTupleSchema,
} from './getItemSchema.ts';
import { isHandedOut } from './graph/handedOut.ts';
import KeyedMemo from './graph/keyedMemo.ts';
import buildPlan, {
  checkCondition,
  mergeAllOf,
  asTarget,
  cachedPolicy,
  childSeeds,
  declaresKeyword,
  emptySchema,
  extraKeySeeds,
  ownChains,
  ownedDepData,
  seedsAt,
  seedsKey,
  tupleSeeds,
  withoutKeys,
} from './graph/mergePlan.ts';
import type {
  CheckedCondition,
  FixedCondition,
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
import { schemaFrom } from './graph/schemaFrom.ts';
import { declaresUnconditionally, scopeOf } from './graph/validationTargets.ts';
import isMultiSelect from './isMultiSelect.ts';
import { resolveDeclaredConstantOptions } from './resolveConstantOptions.ts';
import {
  dependencyOption,
  fieldOf,
  fieldTypeSchema,
  isLeafSchema,
  mergesOwnSubschemas,
  optionMatchContext,
  optionMatchKey,
  OPTION_KEYWORDS,
  optionNode as offeredOption,
  resolveMergedOwnRef,
  retrieveField,
  retrieveFieldFor,
  joinOptionExtraKeys,
  stubExistingAdditionalProperties,
} from './retrieveSchema.ts';

const PRIMITIVE_TYPES = ['string', 'number', 'integer', 'boolean', 'null'];

/** The keywords retrieving a schema merges subschemas in through; it leaves the own keywords of a schema holding none */
const MERGING_KEYWORDS = [REF_KEY, ALL_OF_KEY, IF_KEY, DEPENDENCIES_KEY];

/** The keywords through which a schema may reject a value that is no object: the options it offers, and those that
 * merge in subschemas that may hold them. Under `constAsDefaults: 'always'` its `const` replaces the value too
 */
const REJECTING_KEYWORDS = [ENUM_KEY, ONE_OF_KEY, ANY_OF_KEY, ...MERGING_KEYWORDS];

function holdsAnyOf(schema: object, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => Object.hasOwn(schema, keyword));
}

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

/** Whether `mergeDefaultsIntoFormData` says a default replaces a value the form data holds as `undefined`
 *
 * @param defaultFormStateBehavior - The DefaultFormStateBehavior to check
 * @returns - True if a default replaces an `undefined` value of the form data
 */
function defaultReplacesUndefined(defaultFormStateBehavior?: DefaultFormStateBehavior): boolean {
  return defaultFormStateBehavior?.mergeDefaultsIntoFormData === 'useDefaultIfFormDataUndefined';
}

/** Whether a field's defaults replace the value `data` it holds that is no object, as `foldView()` merges them: a
 * missing value or a `NaN` always, and a `null` where it is the whole form data or `mergeDefaultsIntoFormData` says so
 *
 * @param data - The value the field holds
 * @param isRoot - Whether the field is the root, whose value is the whole form data
 * @param defaultFormStateBehavior - The DefaultFormStateBehavior to check
 * @returns - True if the field's defaults replace `data`
 */
function defaultsReplace(data: unknown, isRoot: boolean, defaultFormStateBehavior?: DefaultFormStateBehavior): boolean {
  return (
    data === undefined ||
    (typeof data === 'number' && Number.isNaN(data)) ||
    (data === null && (isRoot || defaultReplacesUndefined(defaultFormStateBehavior)))
  );
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
 * @testSeam Exported for utils' own tests
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
  } else if (
    writesPropertyDefault(computedDefault, requiredFields.includes(key), isParentRequired, emptyObjectFields)
  ) {
    setOwn(acc, key, computedDefault);
  }
}

/** Whether the defaults write `computedDefault` into a property, as `emptyObjectFields` decides it for
 * `maybeAddDefaultToObject()` where neither `includeUndefinedValues`, a `const` nor a `null` fill adds it regardless
 *
 * @param computedDefault - The default computed for the property
 * @param isRequired - Whether the object holding the property lists it in its `required`
 * @param isParentRequired - Whether that object is required itself, undefined for the root or an object the
 *        defaults reach with no `required` of its own
 * @param [emptyObjectFields='populateAllDefaults'] - How to treat an empty object field
 * @returns - Whether the default is written into the property
 */
export function writesPropertyDefault(
  computedDefault: unknown,
  isRequired: boolean,
  isParentRequired: boolean | undefined,
  emptyObjectFields: NonNullable<DefaultFormStateBehavior['emptyObjectFields']> = 'populateAllDefaults',
): boolean {
  if (emptyObjectFields === 'skipDefaults') {
    return false;
  }
  // If isParentRequired is undefined, then we are at the root level of the schema so defer to the requiredness of
  // the field key itself in the `requiredField` list
  const isSelfOrParentRequired = isParentRequired ?? isRequired;
  if (isObject(computedDefault)) {
    // If emptyObjectFields 'skipEmptyDefaults' store computedDefault if it's a non-empty object(e.g. not {})
    if (emptyObjectFields === 'skipEmptyDefaults') {
      return Object.keys(computedDefault).length > 0;
    }
    // Else store computedDefault if it's a non-empty object(e.g. not {}) and satisfies certain conditions
    // Condition 1: If computedDefault is not empty or if the key is a required field
    // Condition 2: If the parent object is required or emptyObjectFields is not 'populateRequiredDefaults'
    return (
      (Object.keys(computedDefault).length > 0 || isRequired) &&
      (isSelfOrParentRequired || emptyObjectFields !== 'populateRequiredDefaults')
    );
  }
  // Store computedDefault if it's a defined primitive (e.g., true) and satisfies certain conditions
  // Condition 1: computedDefault is not undefined
  // Condition 2: If emptyObjectFields is 'populateAllDefaults' or 'skipEmptyDefaults)
  // Or if isSelfOrParentRequired is 'true' and the key is a required field
  return (
    computedDefault !== undefined &&
    (emptyObjectFields === 'populateAllDefaults' ||
      emptyObjectFields === 'skipEmptyDefaults' ||
      (isSelfOrParentRequired && isRequired))
  );
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
function withDefaultOf<S extends StrictRJSFSchema>(parent: S, renderedOption: S): S {
  return DEFAULT_KEY in parent
    ? (mergeSchemas({ [DEFAULT_KEY]: parent[DEFAULT_KEY] }, renderedOption) as S)
    : renderedOption;
}

/** For each object of the form data, the properties recorded for it. The map is made by the first one recorded: most
 * schemas hold no `null` type, and every field of a fold starts a record of its own
 */
class KeysByObject {
  private byObject?: Map<object, Set<string>>;

  add(owner: object, key: string) {
    this.byObject ??= new Map();
    const keys = this.byObject.get(owner) ?? new Set<string>();
    keys.add(key);
    this.byObject.set(owner, keys);
  }

  keysOf(owner: object): ReadonlySet<string> | undefined {
    return this.byObject?.get(owner);
  }

  get isEmpty(): boolean {
    return this.byObject === undefined;
  }

  forEach(visit: (owner: object, key: string) => void) {
    this.byObject?.forEach((keys, owner) => {
      keys.forEach((key) => visit(owner, key));
    });
  }
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
  overUndefined: KeysByObject;
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
 * @param nestedDefaultsPrecedence - Whether a field's own default or the one its ancestors hand it wins
 * @returns - The context for the `null` fills alone
 */
function nullsOnlyContext<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  nestedDefaultsPrecedence = context.defaultFormStateBehavior?.nestedDefaultsPrecedence,
): SchemaContext<S, F> {
  return {
    ...context,
    defaultFormStateBehavior: {
      ...context.defaultFormStateBehavior,
      emptyObjectFields: 'skipDefaults',
      constAsDefaults: 'never',
      nestedDefaultsPrecedence,
    },
  };
}

/** Marks a context under which the fold reads no schema's `default`, see `skippingDefaults()`. A context spread from
 * one keeps the mark
 */
const SKIPS_DEFAULTS = Symbol('skipsDefaults');

/** `context` under which `foldView()` reads each field without its `default`: under `allOf: 'skipDefaults'`, a key
 * only an object's unmerged `allOf` declares has its own `default`, and those nested below it, from that `allOf`, which
 * the setting skips, so it takes only what the object's default gives it, its `const`s and its `null` fills, not the
 * `false` a required boolean takes in place of a default
 *
 * @param context - The `SchemaContext` the defaults are computed in
 * @returns - The context that skips the `default`s
 */
function skippingDefaults<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
): SchemaContext<S, F> {
  // Only `context` spread with the mark is kept under `context`, but the memo can't carry its type parameters
  return skippingContexts.get([context], () => ({ ...context, [SKIPS_DEFAULTS]: true })) as SchemaContext<S, F>;
}

/** The context `skippingDefaults()` returns, per context it is built from, so it keeps its identity across the passes
 * and calls whose memos compare the context first
 */
const skippingContexts = new KeyedMemo<object>();

/** The schema `foldView()` reads under `skippingDefaults()`, per schema it is read from, so it keeps its identity across
 * the passes and calls that read it, as the caches keyed on a schema need
 */
const schemasWithoutDefault = new WeakMap<object, StrictRJSFSchema>();
function withoutDefault<S extends StrictRJSFSchema>(schema: S): S {
  let stripped = schemasWithoutDefault.get(schema);
  if (stripped === undefined) {
    stripped = withoutKeys(schema, DEFAULT_KEY);
    schemasWithoutDefault.set(schema, stripped);
  }
  // Only `schema` copied without its `default` is stored under `schema`, but the memo can't carry its type parameter
  return stripped as S;
}

/** The context `nullsOnlyContext()` gives a key only an unmerged `allOf` declares, its ancestors' defaults winning,
 * per context it is built from, so it keeps its identity across the passes, whose memo compares the context first
 */
const branchSkippingContexts = new WeakMap<object, object>();
function skippingBranchDefaults<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
): SchemaContext<S, F> {
  let skipping = branchSkippingContexts.get(context);
  if (skipping === undefined) {
    skipping = nullsOnlyContext(context, 'ancestorWins');
    branchSkippingContexts.set(context, skipping);
  }
  // Only `context` with the settings `nullsOnlyContext()` gives is stored under `context`, but the WeakMap can't carry
  // its type parameters
  return skipping as SchemaContext<S, F>;
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
    nullFills.overUndefined.add(formData, key);
  }
}

/** The `null` fills of `nullFills` with none recorded yet, for a fold whose fills count only if its value is kept */
function freshFills(nullFills: NullFills | undefined): NullFills | undefined {
  return nullFills && { ...nullFills, overUndefined: new KeysByObject() };
}

/** Records the `null` fills of `from` in `into` */
function addFills(into: NullFills | undefined, from: NullFills | undefined) {
  from?.overUndefined.forEach((formData, key) => fillOverUndefined(into, formData, key, null));
}

/** Puts the `null` of each `null` schema's field the form data holds as `undefined` into `merged`, see
 * `NullFills.overUndefined`. `merged` holds the keys of `formData` at every level, except those the defaults leave out,
 * such as keys an object `const` doesn't name under `constAsDefaults: 'always'` and object data a property's schema
 * can't take, so the two are walked together where both hold a key. An
 * object or array of `merged` is copied before a `null` goes into it, since a shallow merge hands back the caller's own
 *
 * @param merged - The defaults merged into the form data
 * @param formData - The form data, whose objects `nullFills` names
 * @param nullFills - The `null` fills of the call, if any
 * @returns - `merged` with the `null`s in, or `merged` itself when it takes none
 */
function withNullFills<V>(merged: V, formData: unknown, nullFills: NullFills | undefined): V {
  if (
    !nullFills ||
    nullFills.overUndefined.isEmpty ||
    typeof merged !== 'object' ||
    merged === null ||
    typeof formData !== 'object' ||
    formData === null
  ) {
    return merged;
  }
  const fills = nullFills.overUndefined.keysOf(formData);
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
  /** Each condition the field's plan checked */
  readonly checked: readonly CheckedCondition<S>[];
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
  /** The field's schema as last merged, see `mergedSchemaOf()` */
  readonly merged: MergedSchema<S>;
}

/** The field a view stands for, and the schema it was last merged into with the context it was merged with */
interface MergedSchema<S extends StrictRJSFSchema> {
  field?: Provenance<S>;
  context?: object;
  schema?: S;
  /** What `constSchemaOf()` gave the view, and the context it gave it for */
  constContext?: object;
  constSchema?: S;
  /** What `isWholeValueField()` gave the view, and the context it gave it for */
  wholeContext?: object;
  wholeValue?: boolean;
  /** What the reads of the merged schema decided, the plans of the retrieves `mergedSchemaOf()` made among them, which
   * the field's fixed point reads
   */
  readers?: Reader<S>[];
}

/** The options selected for a field: the option chosen from each list, by the node holding it, and the lists chosen
 * from, which an option leading back to one of them does not offer again
 */
interface OptionState {
  readonly selections: ReadonlyMap<NodeId, number>;
  readonly chosen: ReadonlySet<unknown>;
  /** The option chosen from each list an `allOf` the field's plan left unmerged offers, by the node holding the list,
   * which seeds the field where that `allOf` sits, see `adoptableList()`. The last one chosen comes first: the plan
   * merges the options a field is seeded with last to first, so each is merged over the one whose list offered it, as
   * `allOf: 'populateDefaults'` merges it, and its keys follow that option's
   */
  readonly adopted?: ReadonlyMap<NodeId, Seed>;
}

const NO_OPTIONS: OptionState = { selections: new Map(), chosen: new Set() };

/** A child computed in an earlier pass of its object's dependency fixed point, and what it was computed from */
interface MemoEntry {
  readonly inputs: readonly unknown[];
  value?: unknown;
  /** Whether `value` holds a `null` fill, which a hit reports as its fold did */
  holdsNull?: boolean;
  /** Whether the fold of `value` took an object `const`, which a hit reports as its fold did */
  objectConst?: boolean;
  /** Whether a declared default reached `value`, which a hit reports as its fold did, see `FoldProps.onReachedDefault` */
  reachedDefault?: boolean;
  /** The `null` fills the fold of `value` recorded, which a hit records as its fold did */
  fills?: NullFills;
}

/** The props the fold hands each field: those of `computeDefaults()`, holding the data as it comes */
interface FoldProps<T, S extends StrictRJSFSchema, F extends FormContextType> extends Omit<
  ComputeDefaultsProps<T, S, F>,
  'parentDefaults' | 'rawFormData' | 'rootSchema'
> {
  parentDefaults?: unknown;
  /** The value an ancestor's `const` gives the field, which `parentDefaults` holds. A `const` is a constraint and a
   * `default` a suggestion, so it wins over the field's own `default` as an ancestor's default does under
   * `nestedDefaultsPrecedence: 'ancestorWins'`, whatever that setting says
   */
  parentConst?: unknown;
  rawFormData?: unknown;
  /** The children of the field computed so far, which a pass of the field's dependency fixed point reuses when they
   * would be computed from the same inputs again
   */
  memo?: Map<string, MemoEntry>;
  /** What the passes of the field's fixed point share */
  passes?: FieldPasses<S>;
  /** Whether the field's object `const`, its own, a branch's or its shown option's, is left out of its defaults, to
   * tell whether anything else gives an optional object a value; its children's `const`s still count
   */
  leavesOutObjectConst?: boolean;
  /** Called where the field may take an object `const` `leavesOutObjectConst` would leave out, so a fold that never
   * calls it computes what one leaving it out would. A child's own fold doesn't call it
   */
  onObjectConst?: () => void;
  /** Called with the defaults and the `const` the field hands its children, see `fieldFillOf()`. A child's own fold
   * doesn't call it
   */
  onHandDown?: (defaults: unknown, givenConst: unknown) => void;
  /** Whether `parentDefaults` come from a `default` an ancestor declares, its `const` or one they inherit, rather than
   * from values the ancestor computed, as a tuple's items are
   */
  inheritsDeclared?: boolean;
  /** Called where a `default` the field declares or inherits, or the value an ancestor's `const` gives it, reached its
   * value or one below it, other than a `minItems` filler, see `fieldFillOf()`
   */
  onReachedDefault?: () => void;
  /** The option each field shows, which a field offering `anyOf`/`oneOf` options computes its defaults from */
  fieldState?: FormFieldState<S>;
  /** The path of the field, which only `fieldState` is asked about, so without one none is built */
  fieldPath?: FoldPath;
  /** The object parent of the `anyOf`/`oneOf` option the field is, without its options, and that option, each as
   * `retrieveSchema()` resolves it for the data, retrieved on the first call. The field that renders the option's extra
   * keys, the parent's `ObjectField` or, where the option offers options of its own, the option's, takes them as the
   * parent with the option's extra-key keywords joined (see `joinOptionExtraKeys()`), so the two decide whether the
   * user can add, remove or rename one, whatever `const` the option holds
   */
  optionOf?: { readonly parent: () => S; readonly option: () => S };
}

/** A field's path as its parent's and its own key, so a child's is made without copying its parent's, and is spelled
 * out only for a field `fieldState` is asked about, see `pathListOf()`
 */
interface FoldPath {
  parent?: FoldPath;
  key: string | number;
}

/** Returns the segments of `path`, none for the root */
function pathListOf(path?: FoldPath): FieldPathList {
  const list: FieldPathList = [];
  for (let at = path; at; at = at.parent) {
    list.push(at.key);
  }
  return list.reverse();
}

/** The `fieldState` and path the child at `key` of a field is folded with, none without a `fieldState`. The memos key
 * no child by its path, which they need not: a child memoized across the passes of its field's fixed point is
 * memoized by its key, which fixes its path, except a `minItems` filler, which holds no data and so is never asked
 * which option it shows, and a leaf memoized across calls offers no options to ask about
 */
function childPathProps<T, S extends StrictRJSFSchema, F extends FormContextType>(
  { fieldState, fieldPath }: FoldProps<T, S, F>,
  key: string | number,
): Pick<FoldProps<T, S, F>, 'fieldState' | 'fieldPath'> {
  return fieldState ? { fieldState, fieldPath: { parent: fieldPath, key } } : {};
}

/** The props `foldView()` computes a field with: the field's own, with what it reports the last view it computed the
 * field from to, which is the field's view with its options selected, whose `dependencies` the field's fixed point
 * qualifies
 */
interface ViewProps<T, S extends StrictRJSFSchema, F extends FormContextType> extends FoldProps<T, S, F> {
  track: (view: DefaultsView<S>) => void;
  passes: FieldPasses<S>;
}

/** What the passes of a field's dependency fixed point share, all of which read the same data */
interface FieldPasses<S extends StrictRJSFSchema> {
  /** Returns the `additionalProperties` of the object field as rendered, retrieved or joined with an option, sharing
   * what is equal with the one the last pass read. Each pass plans the field anew, so it retrieves anew, and the
   * extra-key schema it hands its children keeps its identity, so their memo hits
   */
  shareExtraKeySchema<V>(extraKeySchema: V): V;
  /** Returns `raw` as `retrieveSchema()` resolves it for the field's data, its conditions and `dependencies` decided
   * by `depData`, retrieved once per pass: an option and the parent beside it, which the folds of a pass would
   * otherwise retrieve again. `owner` and `slot` name what `raw` is read from, since a parent without its options is a
   * new object on every call
   */
  retrieveOnce(owner: object, slot: string, raw: S, depData: unknown): S;
  /** Returns a view of the field as `SchemaField` retrieves it, settled once per view of a pass, so the `const` read
   * and the object's extra keys share one retrieve
   */
  retrievedViewOf(view: DefaultsView<S>): DefaultsView<S>;
  /** Returns what the retrieves of `retrieveOnce()` and `retrievedViewOf()` decided since the last call, which the pass
   * read as it read the decisions of the field's own plan
   */
  takeReaders(): readonly Reader<S>[];
}

/** What a plan decided from its dependency data: the conditions it checked, the `dependencies` it qualified and the
 * option it chose of each list they flag, which the fold may have selected instead, see `policyFor()`
 */
type Reader<S extends StrictRJSFSchema> = Pick<MergePlan<S>, 'graph' | 'entries' | 'checked' | 'choices'> & {
  readonly options?: OptionState;
  /** Whether there was dependency data, where a read of the field decided by that alone, see `mergedConstSchemaOf()` */
  readonly present?: boolean;
};

/** Returns the `FieldPasses` of a field's fixed point over `data`. Only a field with an object `const` or options uses
 * them, so their stores are made on first use
 */
function fieldPasses<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  data: unknown,
): FieldPasses<S> {
  let lastExtraKeySchema: unknown;
  let retrievals: KeyedMemo<S> | undefined;
  let retrievedViews: KeyedMemo<DefaultsView<S>> | undefined;
  let retrievedPlans: Reader<S>[] = [];
  let retrieved: DefaultsView<S>[] = [];
  return {
    shareExtraKeySchema(extraKeySchema) {
      const shared = replaceEqualDeep(lastExtraKeySchema, extraKeySchema);
      lastExtraKeySchema = shared;
      return shared;
    },
    retrieveOnce(owner, slot, raw, depData) {
      retrievals ??= new KeyedMemo<S>();
      return retrievals.get([owner, slot, depData], () => {
        const root = parseSchemaGraph<S>(rootSchema);
        return retrieveRead<S, F>(context, root, fieldOf<S>(root, raw), data, depData, retrievedPlans);
      });
    },
    retrievedViewOf(view) {
      retrievedViews ??= new KeyedMemo<DefaultsView<S>>();
      return retrievedViews.get([view], () => {
        // An option adopted from a list an unmerged `allOf` offers is merged into the field it renders, as an option of
        // the field's own list is through its selection, so the keys only that option declares are the field's too.
        // Its seeds are the retrieved field's own, so `viewField()` isn't handed them again
        const { adopted, ...options } = view.options;
        const seeds = adopted ? [...view.field.seeds, ...adopted.values()] : view.field.seeds;
        const settled = settle(context, { ...view.field, seeds, retrieves: true }, view.data, view.depData, options);
        retrieved.push(settled);
        return settled;
      });
    },
    takeReaders() {
      const taken = [...retrieved.flatMap((view) => [view, ...(view.merged.readers ?? [])]), ...retrievedPlans];
      retrieved = [];
      retrievedPlans = [];
      return taken;
    },
  };
}

/** Returns the policy fields are planned with: which `allOf`s and `if`s are merged, and which options. An option of a
 * list `OptionChoice.dependencies` flags, beside `dependencies` or in a `dependencies` entry, is merged as the one the
 * data and the defaults so far match first; an option the fold selected is merged as selected. Every other option list
 * is left on the schema for the fold to select from.
 */
function policyFor<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  graph: SchemaGraph<S>,
  allOf: boolean | 'if',
  conditions: boolean,
  selections: ReadonlyMap<NodeId, number>,
  cutRecursion = false,
  optionPolicy?: OptionPolicy,
): PlanPolicy<S> {
  let key = `defaults|${optionMatchKey(context)}|${allOf}|${conditions}|${cutRecursion}|${optionPolicy?.allOf}|${optionPolicy?.conditions}`;
  for (const [provider, index] of selections) {
    key += `|${provider}:${index}`;
  }
  return cachedPolicy<S>(context.validator, graph, key, () => {
    const matchContext = optionMatchContext(context);
    return {
      allOf,
      conditions,
      cutRecursion,
      selectOption: (request) =>
        selections.get(request.provider) ?? dependencyOption(matchContext, request, request.depData),
      // An option the fold selects keeps the ref path of the node offering it: restarting it, as render does, would
      // restart it at every level of a recursion through an option chosen without data, which nothing then bounds
      optionsInheritRefPath: true,
      optionPolicy,
    };
  });
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
    checked: plan.checked,
    keywords,
    collapsed: false,
    stubs: stubsFor(context, field, keywords),
    options,
    allOf,
    conditions,
    data,
    depData,
    merged: {},
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
    checked: [],
    keywords: new Set(Object.keys(schema)),
    collapsed: false,
    stubs: false,
    options: NO_OPTIONS,
    allOf: true,
    conditions: true,
    data,
    depData: data,
    merged: {},
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
  const policy = policyFor(context, graph, allOf, conditions, selections, cutRecursion, optionPolicy);
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

/** The `const` of a field, worked out once per view */
interface FieldConst<S extends StrictRJSFSchema> {
  /** The schema the `const` is read from, see `fieldConstOf()` */
  readonly schema: S;
  /** Whether the field takes the `const` as its default, see `constIsDefault()` */
  readonly isDefault: boolean;
  /** The object `const` the field defaults to, if it defaults to one */
  readonly object?: Record<string, unknown>;
}

/** Returns the `const` of the field of `view`, read from its schema merged for its data where a merge brings one in, see
 * `constSchemaOf()`
 */
function fieldConstOf<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
): FieldConst<S> {
  const { defaultFormStateBehavior } = context;
  const schema = constSchemaOf<S, F>(context, view);
  const isDefault = constIsDefault<S>(schema, defaultFormStateBehavior);
  const value = schema[CONST_KEY];
  return { schema, isDefault, object: isDefault && isObjectData(value) ? value : undefined };
}

/** Whether a node, by graph, leads to an object `const`, see `reachesObjectConst()` */
const objectConstReach = new WeakMap<object, Map<NodeId, boolean>>();

/** Whether a subschema the field may merge or show declares an object `const`: one a seed of the field, or a `$ref`,
 * `allOf`, `then`/`else`, `dependencies` or `anyOf`/`oneOf` option it leads to through those, declares. Only such a
 * field can give an object `const` that its plan leaves unmerged, or that the fold leaves out, so the rest are spared
 * the retrieve and the extra fold that look for one. None does where constants are never defaults
 */
function reachesObjectConst<S extends StrictRJSFSchema>(
  { graph, seeds }: DefaultsField<S>,
  defaultFormStateBehavior: DefaultFormStateBehavior | undefined,
): boolean {
  if (defaultFormStateBehavior?.constAsDefaults === 'never') {
    return false;
  }
  let answers = objectConstReach.get(graph);
  if (answers === undefined) {
    answers = new Map<NodeId, boolean>();
    objectConstReach.set(graph, answers);
  }
  return seeds.some(({ node }) => leadsToObjectConst<S>(graph, node, answers));
}

/** Whether the node `start` of `graph`, or a subschema it leads to as `reachesObjectConst()` follows them, declares an
 * object `const`, recording each answer the walk settles in `answers`, keyed as `objectConstReach` keys them, so no
 * node is walked again once settled. A node that reaches one does, whichever walk finds it. A walk that finds none
 * settles every node it visits, since each leads only to nodes the walk visits too, while one that finds one leaves a
 * node a cycle cut short unsettled
 */
function leadsToObjectConst<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  start: NodeId,
  answers: Map<NodeId, boolean>,
): boolean {
  const visited = new Set<NodeId>();
  const walk = (id: NodeId): boolean => {
    const node = graph.node(id);
    // A boolean or unresolved node declares nothing
    if (answers.has(id) || visited.has(id) || node.kind !== 'schema') {
      return answers.get(id) === true;
    }
    visited.add(id);
    const reaches =
      isObjectData(node.raw[CONST_KEY]) ||
      [
        ...(node.ref === undefined ? [] : [node.ref]),
        ...[THEN_KEY, ELSE_KEY].flatMap((keyword) => graph.child(id, keyword) ?? []),
        ...[ALL_OF_KEY, DEPENDENCIES_KEY, ANY_OF_KEY, ONE_OF_KEY].flatMap((keyword) =>
          graph.subschemas(id, keyword).map(([, child]) => child),
        ),
      ].some(walk);
    if (reaches) {
      answers.set(id, true);
    }
    return reaches;
  };
  const reaches = walk(start);
  if (!reaches) {
    for (const key of visited) {
      answers.set(key, false);
    }
  }
  return reaches;
}

/** Whether the field of `schema` takes a `const` as its default: its own `const`, or one `hasConst` says it has where
 * `schema.const` doesn't show it, a `const` an ancestor gives it or its own spelled out as `undefined`; unless
 * `constAsDefaults` is `'never'` or the field's `const` is an Ajv `$data` reference
 */
function constIsDefault<S extends StrictRJSFSchema>(
  schema: S,
  defaultFormStateBehavior: DefaultFormStateBehavior | undefined,
  hasConst = false,
): boolean {
  return (
    (hasConst || schema[CONST_KEY] !== undefined) &&
    defaultFormStateBehavior?.constAsDefaults !== 'never' &&
    !constIsAjvDataReference(schema)
  );
}

/** Returns the child of `view` that `seeds` seed, reached through `edge`. A subschema the schema's own keywords stand
 * in for, `fallback`, such as the stub of a key whose type is guessed from its data where `additionalProperties` is
 * `true`, is read as it stands where no seed is more than a boolean: the same object on every call, so a pass of a
 * field's fixed point reuses what an earlier pass computed for the child.
 */
function defaultsChild<S extends StrictRJSFSchema>(
  view: DefaultsView<S>,
  seeds: readonly Seed[],
  edge: ContainmentEdge,
  fallback?: unknown,
): DefaultsField<S> {
  const { graph, expanded } = view.field;
  const useFallback = isSchemaObject<S>(fallback) && seeds.every(({ node }) => graph.node(node).kind === 'boolean');
  return { graph, seeds: useFallback ? [] : seeds, expanded, edge, fallback: useFallback ? fallback : undefined };
}

/** A pass of a field's fixed point: the defaults folded for the dependency data the field was planned for, what the
 * plans of the pass decided from that data, and what the field reports to its parent should the pass be kept
 */
interface FieldPass<S extends StrictRJSFSchema> {
  readonly folded: unknown;
  readonly depData: unknown;
  readonly readers: readonly Reader<S>[];
  /** The `null`s the pass puts over the data's `undefined`: a pass whose conditions decided otherwise may have read a
   * property as a `null` schema's field
   */
  readonly fills: NullFills | undefined;
  readonly holdsNull: boolean;
  readonly objectConst: boolean;
  /** What the field handed its children in the pass, see `FoldProps.onHandDown` */
  readonly handedDown?: HandedDown;
  readonly reachedDefault: boolean;
}

/** The defaults and the `const` a field hands its children, which each child reads at its key */
interface HandedDown {
  readonly defaults: unknown;
  readonly givenConst: unknown;
}

/** Computes the defaults of `field` from the fold's state at it. A field that read `dependencies` or a condition, in
 * its plan or in a retrieve of the field, is planned again while the defaults computed so far, under its data, qualify
 * a set of dependencies, decide a condition or match an option of a list they flag otherwise than it was planned with,
 * so a default decides them as the same value in the data does. The passes end once the defaults of a pass decide what
 * it was planned with. A condition can flip from pass to pass, a branch taking back the default that selects it, and
 * then no pass ends them: once a pass would decide as an earlier one did, each condition that flipped since is decided
 * by the data alone, and the passes go on to settle the others. Once they settle, each such condition but the last is
 * decided by the defaults again where the passes still settle, as one that flipped only because it reads the default
 * of another does. Where anything else flipped, the field's data is no object, or the passes outnumber the decisions
 * of the last one, the field is computed as its data alone decides it.
 * A child computed in an earlier pass from the same inputs is not computed again.
 */
function foldField<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  field: DefaultsField<S>,
  props: FoldProps<T, S, F>,
): unknown {
  const data = props.rawFormData;
  const passes = fieldPasses<S, F>(context, field.graph.rawRoot, data);
  const memo = new Map<string, MemoEntry>();
  const fold = (depData: unknown): FieldPass<S> => {
    // The views the pass computed the field from, the last one with the options the field selected, which are planned
    // with it, so the dependencies and conditions they bring are read too
    const views: DefaultsView<S>[] = [];
    const reports: { holdsNull: boolean; objectConst: boolean; reachedDefault: boolean; handedDown?: HandedDown } = {
      holdsNull: false,
      objectConst: false,
      reachedDefault: false,
    };
    const fills = freshFills(props.nullFills);
    let last = settle(context, field, data, depData);
    const folded = foldView(context, last, {
      ...props,
      memo,
      passes,
      nullFills: fills,
      track: (computed) => {
        last = computed;
        views.push(computed);
      },
      onNullFill: () => {
        reports.holdsNull = true;
      },
      onObjectConst: () => {
        reports.objectConst = true;
      },
      onReachedDefault: () => {
        reports.reachedDefault = true;
      },
      onHandDown:
        props.onHandDown &&
        ((defaults, givenConst) => {
          reports.handedDown = { defaults, givenConst };
        }),
    });
    const readers = [last, ...views.flatMap(({ merged }) => merged.readers ?? []), ...passes.takeReaders()];
    return { folded, depData, readers, fills, ...reports };
  };
  const kept = (pass: FieldPass<S>) => {
    if (pass.holdsNull) {
      props.onNullFill?.();
    }
    if (pass.objectConst) {
      props.onObjectConst?.();
    }
    if (pass.handedDown) {
      props.onHandDown?.(pass.handedDown.defaults, pass.handedDown.givenConst);
    }
    if (pass.reachedDefault) {
      props.onReachedDefault?.();
    }
    addFills(props.nullFills, pass.fills);
    return pass.folded;
  };
  let matchContext: SchemaContext<S, F> | undefined;
  const optionFor = (reader: Reader<S>, choice: OptionChoice, depData: unknown) => {
    matchContext ??= optionMatchContext(context);
    return (
      reader.options?.selections.get(choice.provider) ??
      dependencyOption(matchContext, { ...choice, graph: reader.graph, data, depData }, depData)
    );
  };
  // The graphs the readers are plans of, whose places key their decisions, and the conditions among the decisions, by
  // decision, which the passes may fix
  const graphs: SchemaGraph<S>[] = [];
  const conditions = new Map<string, { graph: SchemaGraph<S>; checked: CheckedCondition<S> }>();
  // What `readers` qualify, decide and choose for `depData`, each as its plan did unless `redecides`, by decision: a
  // condition, set of `dependencies` or option list several readers met is decided once
  const decisionsOf = (readers: readonly Reader<S>[], depData: unknown, redecides: boolean): Decisions => {
    const decisions: Decisions = new Map();
    const decide = (graph: SchemaGraph<S>, id: string, decision: () => Decision) => {
      const known = graphs.indexOf(graph);
      const key = `${known === -1 ? graphs.push(graph) - 1 : known}/${id}`;
      if (!decisions.has(key)) {
        decisions.set(key, decision());
      }
      return key;
    };
    for (const reader of readers) {
      for (const [node, key] of dependencyKeysOf(reader)) {
        decide(reader.graph, `d${node}:${key}`, () => getByPath(depData, key) !== undefined);
      }
      for (const checked of reader.checked) {
        const key = decide(reader.graph, `c${checked.site}`, () =>
          redecides ? checkCondition<S, F>(context, reader.graph, checked, depData) : checked.satisfied,
        );
        conditions.set(key, { graph: reader.graph, checked });
      }
      for (const choice of reader.choices.filter(({ dependencies }) => dependencies)) {
        // A reader the fold selected the option for decides as selected, whatever another one matched
        const selection = reader.options?.selections.get(choice.provider);
        decide(reader.graph, `o${choice.provider}:${selection ?? ''}`, () =>
          redecides ? optionFor(reader, choice, depData) : choice.selected,
        );
      }
      if (reader.present !== undefined) {
        decide(reader.graph, 'p', () => (redecides ? depData !== undefined : reader.present));
      }
    }
    return decisions;
  };
  // How the passes from `start` end, each condition of `fixed` decided as fixed: on a pass whose defaults decide what
  // it was planned with, or once a pass would decide as an earlier one did, with what each pass since decided and the
  // data the next would be planned for. Past the pass cap, no pass since is known to repeat
  const passesFrom = (start: FieldPass<S>, fixed: readonly FixedCondition<S>[]): PassesEnd<S> => {
    const seen = new Map<string, Decisions>();
    const cycleFrom = (key: string, depData: unknown) => ({
      cycle: [...seen.values()].slice([...seen.keys()].indexOf(key)),
      depData,
    });
    for (let count = 1, pass = start; ; count += 1) {
      const planned = decisionsOf(pass.readers, pass.depData, false);
      if (planned.size === 0) {
        return { settled: pass };
      }
      const plannedKey = keyOfDecisions(planned);
      if (seen.has(plannedKey)) {
        return cycleFrom(plannedKey, pass.depData);
      }
      seen.set(plannedKey, planned);
      // Merged into the data, the defaults are the data as the fill leaves it at every level, a nested default beside
      // the data of its object and one replacing data the field doesn't take included, which a fill of that data
      // reads again, with the `null`s it puts over the data's `undefined`; otherwise the data is merged over them, a
      // default standing in for a value it lacks
      const filled: unknown = props.shouldMergeDefaultsIntoFormData
        ? withNullFills(pass.folded, data, pass.fills)
        : mergeDefaultsWithFormData(pass.folded, data, false, true);
      // The plans checked their conditions against their dependency data, `{}` standing in for none, so they decide
      // alike for data equal to it, as the data of an edit is once it holds the defaults. Data that differs is handed
      // to the next pass as a copy of the one the comparison built, which shares with this pass's data what the two
      // hold alike, and which the fill owns, so the next pass's plans reuse the checks made against it here
      const plannedFor: unknown = pass.depData ?? {};
      const shared = replaceEqualDeep(plannedFor, filled ?? {});
      const redecides = shared !== plannedFor;
      const next = redecides ? ownedDepData(shared, fixed) : shared;
      const depData = filled === undefined || filled === null ? filled : next;
      const decisionsKey = keyOfDecisions(decisionsOf(pass.readers, depData, redecides));
      if (decisionsKey === plannedKey) {
        return { settled: pass };
      }
      if (seen.has(decisionsKey)) {
        return cycleFrom(decisionsKey, depData);
      }
      if (count > planned.size) {
        return { cycle: [], depData };
      }
      pass = fold(depData);
    }
  };
  const first = fold(data);
  // The conditions decided by the data alone, as the first pass decided them, whatever the defaults, by decision
  const fixed = new Map<string, FixedCondition<S>>();
  let end = passesFrom(first, []);
  // The passes since the one a pass would repeat decide alike but for what flips from pass to pass. Each condition
  // that flips is fixed as the data alone decides it, for the passes to settle the rest. Should anything else flip, or
  // nothing new, the field is computed as its data alone decides it
  while (!('settled' in end)) {
    const { cycle, depData } = end;
    const flipping = [...new Set(cycle.flatMap((decisions) => [...decisions.keys()]))].filter(
      (key) =>
        !fixed.has(key) &&
        cycle.every((decisions) => decisions.has(key)) &&
        cycle.some((decisions) => decisions.get(key) !== cycle[0].get(key)),
    );
    if (flipping.length === 0) {
      return kept(first);
    }
    for (const key of flipping) {
      const condition = conditions.get(key);
      if (condition === undefined) {
        return kept(first);
      }
      const { graph, checked } = condition;
      fixed.set(key, { graph, site: checked.site, satisfied: checkCondition(context, graph, checked, data) });
    }
    const all = [...fixed.values()];
    end = passesFrom(fold(ownedDepData(depData, all)), all);
  }
  // A condition may flip only as it reads the default of one that takes it back, and settle once that one is fixed:
  // each fixed condition is decided by the defaults again where the passes then settle with the others fixed. The last
  // one is kept, since with none fixed the passes cycled
  let { settled } = end;
  for (const [key, condition] of fixed) {
    if (fixed.size === 1) {
      break;
    }
    const others = [...fixed.values()].filter((other) => other !== condition);
    const released = passesFrom(fold(ownedDepData(settled.depData, others)), others);
    if ('settled' in released) {
      fixed.delete(key);
      settled = released.settled;
    }
  }
  return kept(settled);
}

/** How the passes of a field's fixed point end: on the pass whose defaults decide what it was planned with, or in a
 * cycle, with what each pass of it decided, none where the passes outnumbered the decisions, and the data the next
 * pass would be planned for
 */
type PassesEnd<S extends StrictRJSFSchema> =
  | { readonly settled: FieldPass<S> }
  | { readonly cycle: readonly Decisions[]; readonly depData: unknown };

/** A decision a plan made from its dependency data: whether a condition held, a set of `dependencies` qualified or
 * there was data, or the option chosen of a list
 */
type Decision = boolean | number | undefined;

/** What the plans of a pass decided, by decision */
type Decisions = Map<string, Decision>;

/** `decisions` as a key equal for equal decisions in the same order */
function keyOfDecisions(decisions: Decisions): string {
  return [...decisions].map(([key, decision]) => `${key}=${decision}`).join(';');
}

/** The `dependencies` keys of the nodes a plan merged, by node */
function dependencyKeysOf<S extends StrictRJSFSchema>({ graph, entries }: Reader<S>): [NodeId, string][] {
  return entries.flatMap(({ node: id }): [NodeId, string][] => {
    const node = graph.node(id);
    const dependencies: unknown = node.kind === 'schema' ? node.raw.dependencies : undefined;
    return isObject(dependencies) ? Object.keys(dependencies).map((key) => [id, key]) : [];
  });
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
    props.parentConst,
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
    props.leavesOutObjectConst,
    props.inheritsDeclared,
  ];
  const leaf = leafOf(child);
  let entry = [memo?.get(memoKey), leaf && leafDefaults.get(leaf)].find((held) =>
    held?.inputs.every((input, index) => Object.is(input, inputs[index])),
  );
  if (entry === undefined) {
    const computed: MemoEntry = { inputs, fills: freshFills(props.nullFills) };
    computed.value = foldField<T, S, F>(context, child, {
      ...props,
      nullFills: computed.fills,
      memo: undefined,
      onNullFill: () => {
        computed.holdsNull = true;
      },
      onObjectConst: () => {
        computed.objectConst = true;
      },
      onReachedDefault: () => {
        computed.reachedDefault = true;
      },
    });
    memo?.set(memoKey, computed);
    if (leaf !== undefined && (typeof computed.value !== 'object' || computed.value === null)) {
      leafDefaults.set(leaf, computed);
    }
    entry = computed;
  }
  if (entry.holdsNull) {
    props.onNullFill?.();
  }
  addFills(props.nullFills, entry.fills);
  if (entry.objectConst) {
    props.onObjectConst?.();
  }
  if (entry.reachedDefault) {
    props.onReachedDefault?.();
  }
  return entry.value;
}

/** Computes the defaults of a field from its view: the `const`, `default` and parent defaults that apply to it, the
 * defaults of its tuple items, the option it selects and the defaults its type gives it, over which its data is merged
 * when `shouldMergeDefaultsIntoFormData` is set
 */
function foldView<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  fieldView: DefaultsView<S>,
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
  inputProps.track(fieldView);
  // A field with no `default` has none to strip, so it is read as it stands rather than copied
  const view =
    SKIPS_DEFAULTS in context && DEFAULT_KEY in fieldView.schema
      ? { ...fieldView, schema: withoutDefault(fieldView.schema) }
      : fieldView;
  const { schema } = view;
  const rootSchema = view.field.graph.rawRoot;
  // Apply `ui:definitions` at every field, keyed by the `$ref` its plan was resolved from, so defaults see the same
  // uiSchema `SchemaField` renders with
  const uiSchema = uiSchemaDefinitions
    ? resolveUiSchema<T, S, F>(schema, localUiSchema, { rootSchema, uiSchemaDefinitions })
    : localUiSchema;
  const props = uiSchema === localUiSchema ? inputProps : { ...inputProps, uiSchema };
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const uiInitialValue = uiOptions.initialValue;
  // A `ui:initialValue` takes the place of an ancestor's `const` on every pass, as it does of the field's own below, so
  // the defaults beneath it aren't taken back by the `const` once the defaults were generated
  const parentConst = uiInitialValue === undefined ? props.parentConst : undefined;
  // Compute the defaults recursively: give highest priority to deepest nodes unless nestedDefaultsPrecedence is ancestorWins.
  // A value an ancestor's `const` gives the field stands in for inherited defaults that don't reach it, as for a row of
  // an array the data holds once the defaults were generated, whose defaults are read from the row
  let defaults: unknown = parentDefaults === undefined ? ownValue(parentConst) : parentDefaults;
  // An ancestor default wins only where the field's type can hold it, so a `null` or `false` one gives way to the own
  // default of a field whose type allows neither. A value an ancestor's `const` gives wins whatever the setting says
  const preferParentDefaults =
    defaults !== undefined &&
    (defaultFormStateBehavior?.nestedDefaultsPrecedence === 'ancestorWins' || parentConst !== undefined) &&
    takesValueOf<S>(schema, defaults);
  // Worked out by the `oneOf`/`anyOf` branch, so it isn't worked out again for this node's type-based default
  let isWholeValue: boolean | undefined;
  let isTupleBuilt = false;
  // A collapsed field keeps its own keywords, but selecting an option would plan it again past the collapse. A list the
  // field has chosen from already is reached again only through an option leading back to it, which ends the choice
  const offered = view.collapsed ? undefined : getXxxOfOptions<S>(schema);
  const fieldConst = fieldConstOf<S, F>(context, view);
  // A list an `allOf` the plan left unmerged offers is the field's as one of its own is, where it has none and no
  // `const` of its own that would win over the option's
  const adopted =
    offered === undefined && constValueOf<S>(fieldConst.schema) === undefined
      ? adoptableList<S, F>(context, view)
      : undefined;
  const xxxOf = offered && !view.options.chosen.has(offered.options) ? offered : adopted?.list;
  const offering = adopted?.offering ?? view;
  const { schema: constSchema } = fieldConst;
  if (fieldConst.object !== undefined) {
    props.onObjectConst?.();
  }
  const leavesOutConst = props.leavesOutObjectConst === true && fieldConst.object !== undefined;
  const constDefault = fieldConst.isDefault && !leavesOutConst;
  if (constDefault) {
    defaults = ownValue(constSchema[CONST_KEY]);
  }
  // A value an ancestor's `const` gives that the field's type can't hold is no value of the field, so it gives none of
  // its parts to the field's children
  const heldParentConst = preferParentDefaults ? parentConst : undefined;
  // The `const` whose value the field hands its children: its own where it is the field's default, otherwise the one an
  // ancestor gives it, unless a `ui:initialValue` takes the place of either, so the defaults beneath it that the first
  // pass gave its keys aren't taken back by the `const` once the defaults were generated
  const givenConst = constDefault && uiInitialValue === undefined ? constSchema[CONST_KEY] : heldParentConst;
  // A declared default reaches the field where it declares one, inherits one an ancestor declared, or takes the value
  // an ancestor's `const` gives it. Its own `const` is a constraint rather than a default
  const reachesDefault =
    DEFAULT_KEY in schema ||
    (parentDefaults !== undefined && props.inheritsDeclared === true) ||
    parentConst !== undefined;
  if (reachesDefault) {
    props.onReachedDefault?.();
  }
  // The defaults the field's own `default` and the inherited ones give it: its own wins unless they have precedence, and
  // two objects are merged, except for a select over object constants, whose own default and inherited default each
  // name a whole constant, so a blend of them names none
  const ownDefaults = (): unknown => {
    const ownDefault = ownValue(schema.default);
    if (isObject(defaults) && isObject(ownDefault) && !isWholeValueField<S, F>(context, view)) {
      if (preferParentDefaults && defaultFormStateBehavior?.nestedDefaultsPrecedence === 'ancestorWins') {
        return mergeObjects(ownDefault, defaults);
      }
      // Under `descendantWins` only the value an ancestor's `const` gives wins over the field's own default: the own
      // default still wins over the inherited defaults beside it, and the order of keys the inherited defaults have is
      // kept
      const merged = mergeObjects(defaults, ownDefault);
      return preferParentDefaults && isObject(parentConst) ? mergeObjects(merged, ownValue(parentConst)) : merged;
    }
    return DEFAULT_KEY in schema && !preferParentDefaults ? ownDefault : defaults;
  };
  // An object `const` beside options is the object's defaults, but the option the object shows still renders beside
  // it, as `ObjectField` renders it, so that option is folded with the `const` as its parent's defaults
  const foldsOptionUnderConst = xxxOf !== undefined && fieldConst.object !== undefined;
  // Where the `const` is the field's defaults, nothing below takes their place
  if (!constDefault || foldsOptionUnderConst) {
    if (DEFAULT_KEY in schema && !xxxOf) {
      // A field with `anyOf` or `oneOf` merges its defaults with the data through the option it selects, below
      defaults = ownDefaults();
    } else if (isTupleSchema<S>(schema) && !preferParentDefaults && !xxxOf) {
      // If the schema contains fixed items and parentDefaults does not have precedence
      // Then construct defaults from defaults of array items. A tuple with options is rendered through the selected
      // option, which it is met into below, so its defaults are those of the option as rendered
      // A `false` position allows no item, so the positions at and past it are left unfilled
      isTupleBuilt = true;
      defaults = Array.from({ length: getOpenPrefixLength<S>(schema) }, (_item, idx) =>
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
            uiSchema: getStaticItemsUiSchema<T, S, F>(uiSchema, idx, schema),
            uiSchemaDefinitions,
            nullFills: props.nullFills,
            ...childPathProps<T, S, F>(props, idx),
          },
          props.memo,
        ),
      );
    } else if (xxxOf) {
      const choice = chooseOption<T, S, F>(
        context,
        offering,
        xxxOf,
        rawFormData,
        defaults,
        preferParentDefaults,
        props,
        mergesOwnSubschemas(view.schema)
          ? (data) => retrieveField<S, F>(context, rootProvenance<S>(view.field.graph, view.field.seeds), data)
          : undefined,
        adopted !== undefined,
      );
      isWholeValue = choice.isWholeValue;
      // A list of constants holds one of them whole, as an `enum` does, so a default naming none of them is the field's
      // value as it stands, as an `enum`'s is, rather than giving way to the constant of the option it picked. It is
      // the value out-of-list data is replaced by below, unless the constant wins over both under `constAsDefaults:
      // 'always'`. Data the defaults replace, as they replace it below, is no data here either, so the default stands
      // on each pass, as an `enum`'s does. The field's own `const`, where it is the field's defaults, wins over both
      const fieldDefault =
        !constDefault &&
        choice.offersConstants &&
        defaultsReplace(rawFormData, props.requiredAsRoot === true, defaultFormStateBehavior) &&
        defaultFormStateBehavior?.constAsDefaults !== 'always'
          ? ownDefaults()
          : undefined;
      // A default is no value a user cleared, so a `null` one names a constant only where one of them is `null`
      if (
        fieldDefault !== undefined &&
        viewFormDataMatching<unknown, S, F>(context, view, fieldDefault, undefined, false) === undefined
      ) {
        defaults = fieldDefault;
      } else if (choice.wholeOptions === undefined) {
        // The object's `ui:initialValue` stands in its `const`'s place, whichever uiSchema its option has
        const initialValue = foldsOptionUnderConst ? uiInitialValue : undefined;
        // A select renders none of its options, so no uiSchema entry of an option applies: the option is folded with
        // the field's own uiSchema, its `ui:initialValue` and `ui:emptyValue` included, as the select renders with it
        const optionsUiSchema = choice.rendersAsSelect
          ? withoutFieldOptions<T, S, F>(uiSchema, uiSchema, xxxOf.key)
          : uiSchema;
        // The option's fold hands the field's children what it computes, but the field's own `const`, where it is the
        // field's defaults, is the one they take
        const { onHandDown } = props;
        const optionHandDown =
          onHandDown && constDefault ? (optionDefaults: unknown) => onHandDown(optionDefaults, givenConst) : onHandDown;
        const foldedOption = foldOption<T, S, F>(
          choice.context,
          view,
          xxxOf,
          choice.index,
          {
            ...props,
            uiSchema: optionsUiSchema,
            parentDefaults: defaults,
            parentConst,
            inheritsDeclared: reachesDefault,
            onHandDown: optionHandDown,
          },
          initialValue,
          adopted?.choice,
        );
        // Under the object's own `const`, or the value an ancestor's gives it, a key only the option declares, which the
        // `const` doesn't name and the data doesn't hold, is left out: its default would make the object a value the
        // `const` rejects. A key the `ui:initialValue` names is kept, since that value stands in the `const`'s place, and
        // under an ancestor's `const`, which a `ui:initialValue` puts out of reach, so is a key of the defaults the field
        // inherits or declares, as beside no options
        const givenObjectConst =
          !foldsOptionUnderConst && preferParentDefaults && isObjectData(parentConst) ? parentConst : undefined;
        const keeping = foldsOptionUnderConst
          ? [constSchema[CONST_KEY], schema.properties, rawFormData, initialValue]
          : givenObjectConst && [givenObjectConst, schema.properties, rawFormData, defaults, schema.default];
        const optionValue =
          keeping && isObjectData(foldedOption) ? withoutKeysOutside(foldedOption, keeping) : foldedOption;
        // Data the field takes is its own even where the option it renders through holds none of it, as an option with
        // no value, or one that is no object or takes no object, holds none of object data. Its defaults are merged
        // beneath the data, as an object field's are
        const optionHoldsNone =
          optionValue === undefined ||
          (isObjectData(rawFormData) &&
            (!isObjectData(optionValue) ||
              !optionTakesValueOf<S, F>(
                context,
                offering,
                xxxOf.key,
                choice.index,
                xxxOf.options[choice.index],
                rawFormData,
              )));
        if (optionHoldsNone && shouldMergeDefaultsIntoFormData && rawFormData !== undefined) {
          // A nested value the field's schema rejects falls back to the field's defaults, by the same precedence as
          // where the field has no options
          const matching = viewFormDataMatching<unknown, S, F>(context, view, rawFormData, ownDefaults());
          return matching === undefined
            ? optionValue
            : mergeDefaultsWithFormData(
                optionValue,
                matching,
                defaultFormStateBehavior?.arrayMinItems?.mergeExtraDefaults,
                defaultReplacesUndefined(defaultFormStateBehavior),
              );
        }
        // A value a list of constants names none of is no value of the field, so its default replaces it, as it does
        // for an `enum`. What the option gave in place of the data, its `const` under `constAsDefaults: 'always'` or
        // over a `NaN`, is one the list names. A `ui:initialValue` takes the default's place, as it does below
        if (choice.offersConstants && shouldMergeDefaultsIntoFormData && rawFormData !== undefined) {
          const fieldDefaults =
            uiInitialValue !== undefined && !initialDefaultsGenerated ? uiInitialValue : ownDefaults();
          if (
            fieldDefaults !== undefined &&
            viewFormDataMatching<unknown, S, F>(context, view, optionValue, fieldDefaults) === undefined
          ) {
            return fieldDefaults;
          }
        }
        return optionValue;
      } else {
        // Resolved here rather than by recursing into the option as a primitive select is, since the option's constant
        // is taken as a whole: filling in its properties or items would reduce it to an empty value no option allows.
        // The constant wins over an inherited default, as it does for a primitive `const`, unless constants are never
        // defaults. The `ui:initialValue`/`ui:emptyValue` below still apply, and any form data is kept as it is by
        // `typeDefaults()`
        // Any constant is reported, since only an object one is left out, and only an object value is folded without it
        props.onObjectConst?.();
        // The field's own default, by precedence, is the value out-of-list data is replaced by, as an `enum`'s is,
        // unless its own `const` is its defaults, which wins over that default as it does without the options
        if (!constDefault) {
          defaults = ownDefaults();
        }
        const constant = toConstant<S>(choice.wholeOptions[choice.index]);
        if (
          rawFormData === undefined &&
          !foldsOptionUnderConst &&
          !(props.leavesOutObjectConst && isObjectData(constant)) &&
          choice.context.defaultFormStateBehavior?.constAsDefaults !== 'never'
        ) {
          defaults = ownValue(constant);
        }
      }
    }
  }

  // No defaults defined for this node, fallback to generic typed ones.
  if (defaults === undefined) {
    defaults = ownValue(schema.default);
  }

  // `ui:initialValue` takes priority over `schema.default`; `ui:emptyValue` is only used as a last resort, when
  // nothing else (formData, schema default or `ui:initialValue`) has produced a value for the field.
  if (uiInitialValue !== undefined && !initialDefaultsGenerated) {
    defaults = uiInitialValue;
  } else if (defaults === undefined && uiOptions.emptyValue !== undefined) {
    defaults = uiOptions.emptyValue;
  }

  const foldedType = foldedTypeOf<T, S, F>(
    context,
    view,
    props,
    defaults,
    isWholeValue,
    preferParentDefaults && defaults === null,
  );
  // A tuple built from its items' own defaults hands them only what it inherited, as it folded them with, so what they
  // compute for themselves isn't read as a default an ancestor gave them
  props.onHandDown?.(isTupleBuilt ? parentDefaults : defaults, givenConst);
  const defaultBasedOnSchemaType = typeDefaults<T, S, F>(
    context,
    view,
    props,
    defaults,
    foldedType,
    fieldConst,
    givenConst,
    reachesDefault,
  );

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
    const mergedAllOf =
      !(ALL_OF_KEY in schema) &&
      !view.field.retrieves &&
      view.keywords.has(ALL_OF_KEY) &&
      !(defaultFormStateBehavior?.allOf === 'populateDefaults' && getSchemaType<S>(schema) !== 'object');
    if (isObject(rawFormData) && foldedType !== undefined && foldedType !== 'object') {
      // Object data of a field whose defaults are a whole value or one of another type is the field's value as a whole,
      // so it is kept as it is where the field takes it and its defaults stand otherwise, rather than blended with them
      // key by key
      const matching = viewFormDataMatching<unknown, S, F>(context, view, rawFormData, defaults);
      if (matching !== undefined) {
        defaultsWithFormData = matching;
      } else if (foldedType === 'whole') {
        defaultsWithFormData = defaults;
      }
    } else if (!isObject(rawFormData) || foldedType === undefined) {
      // A value that is no object, and object data of an untyped field, are merged with the field's defaults here.
      // Object data of an object field is not: each of its properties was computed with its data already, its `allOf`
      // merged or not, so the data is matched once, by the field of each property, rather than again by every object it
      // is nested in. The data of an untyped field wins over its defaults, except where its `allOf` was merged: what
      // its properties were computed as from that wins, as an `if`/`then` `const` does. Object data the untyped field
      // can't take is no value of it, so its defaults stand, as a typed field's do above, before and after the form has
      // generated its defaults. Under `constAsDefaults: 'always'` a missing value takes the field's `const`, as the
      // match gives a field its own one, wherever the merge brings it in
      const matching =
        rawFormData === undefined && defaultFormStateBehavior?.constAsDefaults === 'always' && constDefault
          ? constSchema[CONST_KEY]
          : viewFormDataMatching<unknown, S, F>(context, view, rawFormData, defaults);
      if (isObject(rawFormData) && matching !== undefined && initialDefaultsGenerated && !mergedAllOf) {
        // Once the form has generated its defaults, the object data of an untyped field is the user's as it stands, as
        // the extra keys of an object field are (#3759), so a nested object they cleared isn't filled in again
        defaultsWithFormData = matching;
      } else if (matching !== undefined || !isObject(rawFormData)) {
        defaultsWithFormData = mergeDefaultsWithFormData(
          defaultsWithFormData,
          matching,
          mergeExtraDefaults,
          // A value missing or `NaN` takes the defaults, as does a `null` the whole form data is; a `null` the user
          // left in an object or array, and a key of object data the user left `undefined`, keep it unless
          // `mergeDefaultsIntoFormData` says a default replaces it
          (!isObject(rawFormData) && (rawFormData !== null || props.requiredAsRoot === true)) ||
            defaultReplacesUndefined(defaultFormStateBehavior),
          isObject(rawFormData) && mergedAllOf,
        );
        // A value the field doesn't take, one its list of values doesn't offer, is replaced by the field's defaults.
        // Where they hold none, a value that is no object is kept as the user left it, as an object keeps it for a
        // property, so the field keeps it at the root as it does anywhere else
        if (defaultsWithFormData === undefined && !isObjectData(rawFormData)) {
          defaultsWithFormData = rawFormData;
        }
      }
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
  const rendered =
    (ALL_OF_KEY in schema || IF_KEY in schema) &&
    getSchemaType<S>(schema) === undefined &&
    mayHoldNullType(schema, view.graph.rawRoot)
      ? mergedSchemaOf<S, F>(context, view)
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
export function ownValue<V>(value: V): V {
  return asDeclared<V>(copiedValue(value, new WeakMap()));
}

/** Returns the index of the option a field offering `options` shows, as `fieldState` says, or -1 without a
 * `fieldState`, for a select, or for an index naming none of the options, see `fieldShownOption()`. A list an `allOf`
 * entry offers a field holding no list of its own is shown among the options the field renders, `renderedList()`, the
 * product its merge makes of the lists, which is the list the form stores the field's pick for; it is retrieved only
 * once a `fieldState` asks
 */
function shownOptionIndex<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: OfferingSchema<S>,
  options: readonly S[],
  rawFormData: unknown,
  { fieldState, fieldPath }: FoldProps<T, S, F>,
  renderedList: () => readonly unknown[] | undefined,
): number {
  if (!fieldState || rendersOptionsAsSelect<S>(view.schema, options)) {
    return -1;
  }
  return fieldShownOption<S, F>(
    context,
    fieldState,
    pathListOf(fieldPath),
    view.schema,
    options,
    view.graph.rawRoot,
    rawFormData,
    renderedList(),
  );
}

/** A schema offering `anyOf`/`oneOf` options, and the graph and chains that say where each option is declared */
interface OfferingSchema<S extends StrictRJSFSchema> extends Seeding<S> {
  readonly schema: S;
}

/** Picks the option of a field offering `anyOf`/`oneOf` options that it shows, or else the one its data, or its
 * default, matches, and the context the option's defaults are computed in. The option a `fieldState` says the field
 * shows is matched as the field on screen matches it, over its options retrieved for its data. Otherwise, for a field
 * merging subschemas of its own, a list its merge rebuilds where `rendered`, the field as `SchemaField` retrieves it for
 * the value matched, renders it is scored as rendered, whether the list is the field's own or one an `allOf` member
 * offers, and each option of any other list is scored where it is declared, or where the merge that rebuilt its list
 * adopted it.
 */
function chooseOption<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: OfferingSchema<S>,
  { key, options }: XxxOfOptions<S>,
  rawFormData: unknown,
  defaults: unknown,
  preferParentDefaults: boolean,
  props: FoldProps<T, S, F>,
  rendered: ((data: unknown) => S) | undefined,
  adoptsList: boolean,
): {
  context: SchemaContext<S, F>;
  index: number;
  isWholeValue: boolean;
  offersConstants: boolean;
  rendersAsSelect: boolean;
  wholeOptions: S[] | undefined;
} {
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
  const offersConstants = isConstantOptionList<S>(constants);
  const wholeOptions = isWholeValue && offersConstants ? constants : undefined;
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
  // A whole value is picked as it stands, so an inherited default naming one of the options is the one to pick. An
  // ancestor default that wins picks the option too, so the option it is checked against is one that can hold it; one
  // no option holds gives way, so the field's own default picks the option, as it does with no ancestor default. A list
  // of constants is a select holding one of them whole, as an `enum` is, so where the field has no `default` of its own
  // the inherited one picks among them whatever the precedence, rather than the first constant replacing it
  const ancestorPicks =
    (preferParentDefaults || (offersConstants && schema.default === undefined && defaults !== undefined)) &&
    options.some((option, index) => optionTakesValueOf<S, F>(context, view, key, index, option, defaults));
  // A `default: null` of its own is a default, which wins over the inherited one as it does for any other field
  const inheritedDefault = ancestorPicks || schema.default === undefined ? defaults : schema.default;
  // Data the defaults replace, as a `NaN`, is matched as no data, by the default that replaces it
  const heldData = defaultsReplace(rawFormData, props.requiredAsRoot === true, defaultFormStateBehavior)
    ? undefined
    : rawFormData;
  const valueToMatch = heldData ?? (picksWholeOption || ancestorPicks ? inheritedDefault : schema.default);
  // A constant option equal to the value is the one it picked, whatever the validator makes of the others
  const equalOptionIndex = picksWholeOption
    ? wholeOptions.findIndex((option) => deepEquals(toConstant<S>(option), valueToMatch))
    : -1;
  // The option a field shows is the one it renders, which can be another than its data matches, as after a switch to
  // an option the data fits no better than the one before. A field holding no data yet is matched by its `default`
  // A list an `allOf` entry offers a field holding none of its own is one the form stores no pick for: it picks among
  // the options the field renders, the product the merge makes of the lists
  const renderedList = (): unknown[] | undefined =>
    adoptsList && rendered ? Reflect.get(rendered(rawFormData), key) : undefined;
  const shownIndex =
    picksWholeOption || rawFormData === undefined
      ? -1
      : shownOptionIndex<T, S, F>(context, view, options, rawFormData, props, renderedList);
  // With no option stored, a list an `allOf` rebuilt is scored as the field renders it, so the first render picks the
  // option an edit or a reset goes on to show
  const renderedIndex =
    picksWholeOption || shownIndex !== -1 || valueToMatch === undefined || !rendered
      ? shownIndex
      : (rebuiltOptionPick<S, F>(
          context,
          Reflect.get(rendered(valueToMatch), key),
          options,
          rootSchema,
          valueToMatch,
          getDiscriminatorFieldFromSchema<S>(schema),
        ) ?? -1);
  const pickedIndex = picksWholeOption ? equalOptionIndex : renderedIndex;
  const index =
    pickedIndex !== -1
      ? pickedIndex
      : closestOption<S, F>(
          context,
          rootSchema,
          valueToMatch,
          options,
          0,
          false,
          getDiscriminatorFieldFromSchema<S>(schema),
          { seeding: view, keyword: key, offeredBy: view.schema },
        );
  return {
    context: optionContext,
    index,
    isWholeValue,
    offersConstants,
    rendersAsSelect: rendersOptionsAsSelect<S>(select, constants),
    wholeOptions,
  };
}

/** Returns the uiSchema `optionUiSchema` an object's option is folded with, where the option has an entry of its own,
 * with the object's `uiSchema` entry of each key the object declares itself and the option doesn't: `ObjectField`
 * renders those keys beside the option with the object's uiSchema, and the option's field only the keys it declares
 */
function withOwnPropertyEntries<T, S extends StrictRJSFSchema, F extends FormContextType>(
  optionUiSchema: UiSchema<T, S, F> | undefined,
  uiSchema: UiSchema<T, S, F>,
  ownProperties: S['properties'],
  optionProperties: S['properties'],
): UiSchema<T, S, F> | undefined {
  const keys = Object.keys(ownProperties ?? {}).filter(
    (name) =>
      Object.hasOwn(uiSchema, name) &&
      Reflect.get(uiSchema, name) !== undefined &&
      !(optionProperties && Object.hasOwn(optionProperties, name)),
  );
  if (keys.length === 0) {
    return optionUiSchema;
  }
  const withEntries: UiSchema<T, S, F> = optionUiSchema ? { ...optionUiSchema } : {};
  for (const name of keys) {
    setOwn(withEntries, name, Reflect.get(uiSchema, name));
  }
  return withEntries;
}

/** Computes the defaults of a field from the option at `index` of the options it offers. An object renders its own
 * field beside the option, so the option is merged into the whole field: the field is planned again with the option
 * selected, its seeds joining the plan with the ref path of the node offering it. Any other field renders only the
 * option, as `getRenderedOptionSchema()` renders it, so its defaults are those of the option as rendered, the option's
 * children still seeded beside the field's own. The option's `uiSchema` entry is the one its fields see, with the
 * object's `initialValue` where it has none of its own. An option of a list an unmerged `allOf` offers, `allOfList`,
 * seeds the field where that `allOf` sits instead, see `adoptableList()`.
 */
function foldOption<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  { key, options }: XxxOfOptions<S>,
  index: number,
  props: ViewProps<T, S, F>,
  initialValue?: unknown,
  allOfList?: OptionChoice,
): unknown {
  const { schema, field } = view;
  const { graph } = field;
  const rootSchema = graph.rawRoot;
  const remaining = withoutKeys(schema, key);
  const chosen = new Set(view.options.chosen).add(options);
  // Which of the two the field is gets asked of it as the fields ask it
  const fieldSchema = fieldTypeSchema<S, F>(context, remaining, rootSchema, props.rawFormData);
  const listedOption: unknown = options[index];
  const rendersOwnField = rendersOwnFieldBesideOption<S>(fieldSchema, listedOption);
  // An entry of the field's uiSchema list describes the option of its list as written that the option was built from,
  // as the field reads it, see `renderedOptionsUiSchema()`
  const written = Array.isArray(props.uiSchema?.[key]) ? seedsWrittenList<S>(graph, field.seeds, key) : undefined;
  const writtenIndex =
    written === undefined || written === options
      ? undefined
      : writtenOptionIndices<S>(options, written, rootSchema)?.[index];
  const optionUiSchema = getOptionUiSchema<T, S, F>(props.uiSchema, key, writtenIndex ?? index);
  const retrievedOption = isSchemaObject<S>(listedOption)
    ? () => props.passes.retrieveOnce(listedOption, 'option', listedOption, view.depData)
    : undefined;
  // An option whose field takes the object's extra keys is asked as the field renders it, retrieved for the data, and
  // only where it has a uiSchema of its own for the object's to lie beneath
  const renderedUiSchema =
    rendersOwnField && optionUiSchema !== props.uiSchema && retrievedOption
      ? getRenderedOptionUiSchema<T, S, F>(fieldSchema, retrievedOption(), props.uiSchema, optionUiSchema)
      : optionUiSchema;
  let uiSchema = withoutFieldOptions<T, S, F>(renderedUiSchema, props.uiSchema, key);
  if (rendersOwnField && props.uiSchema && optionUiSchema !== props.uiSchema) {
    uiSchema = withOwnPropertyEntries<T, S, F>(
      uiSchema,
      props.uiSchema,
      mergedSchemaOf<S, F>(context, view).properties,
      retrievedOption?.().properties,
    );
  }
  if (initialValue !== undefined && getUiOptions<T, S, F>(uiSchema).initialValue === undefined) {
    const carrying: UiSchema<T, S, F> = uiSchema ? { ...uiSchema } : {};
    carrying['ui:initialValue'] = initialValue;
    uiSchema = carrying;
  }
  const branchProps = {
    ...props,
    uiSchema,
    isRenderedOption: true,
    // A boolean option holds no extra-key keyword to join, so only an object option is joined
    optionOf:
      rendersOwnField && retrievedOption
        ? {
            parent: () =>
              fieldSchema === remaining ? props.passes.retrieveOnce(schema, key, remaining, view.depData) : fieldSchema,
            option: retrievedOption,
          }
        : undefined,
  };
  if (allOfList) {
    const seed: Seed = {
      node: allOfList.options[index],
      refPath: allOfList.refPath,
      scope: [`o${allOfList.options[index]}`],
    };
    const selected: OptionState = {
      ...view.options,
      chosen,
      adopted: new Map([[allOfList.provider, seed], ...(view.options.adopted ?? [])]),
    };
    return foldView<T, S, F>(context, { ...view, options: selected, merged: {} }, branchProps);
  }
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
      ? (mergeSchemas(remaining, option) as S)
      : withDefaultOf(
          remaining,
          renderOption<S>(
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
      context,
      graph,
      inherited.optionPolicy?.allOf ?? view.allOf,
      inherited.optionPolicy?.conditions ?? view.conditions,
      NO_OPTIONS.selections,
      merged.collapsed,
    ),
  });
  const rendered = renderOption<S>(remaining, optionAlone.schema);
  return foldView<T, S, F>(
    context,
    { ...merged, schema: schemaFrom(rootSchema, withDefaultOf(remaining, rendered)) },
    branchProps,
  );
}

/** Returns the seeds of a tuple's position at `index`. Beside a `prefixItems` tuple, a chain whose `items` is one schema
 * beside no `prefixItems` of its own describes every item, so it seeds the position too, as `getRenderedOptionSchema()`
 * meets a list's `items` into each position an option's tuple declares. A draft-07 tuple's positions are seeded by its
 * tuple `items` alone, though `getRenderedOptionSchema()` meets a list's `items` into them too
 */
function positionSeeds<S extends StrictRJSFSchema>(view: DefaultsView<S>, index: number): Seed[] {
  const isPrefixTuple = Array.isArray(view.schema.prefixItems);
  return view.chains.flatMap((chain) => {
    const own = { graph: view.graph, chains: [chain] };
    const declared = (keyword: string): unknown => Reflect.get(chain.get(keyword)?.node.raw ?? {}, keyword);
    return isPrefixTuple && !Array.isArray(declared('prefixItems')) && isSchemaObject<S>(declared(ITEMS_KEY))
      ? seedsAt(own, ITEMS_KEY)
      : tupleSeeds(own, index);
  });
}

/** Returns the array item `getInnerSchemaForArrayItem()` picks for `additionalItems` and `idx`: its seeds, the edge it
 * is reached through, and the subschema that function returns for it
 */
function innerItem<S extends StrictRJSFSchema>(
  view: DefaultsView<S>,
  additionalItems: AdditionalItemsHandling,
  idx: number,
): { seeds: readonly Seed[]; edge: ContainmentEdge; fallback: unknown } {
  const { schema } = view;
  const prefixLength = getPrefixLength<S>(schema);
  if (prefixLength > 0) {
    if (idx >= 0 && idx < prefixLength) {
      // A boolean position is the position's own, which the items past the tuple don't describe
      const item = getItemSchema<S>(schema, idx);
      return typeof item === 'boolean'
        ? { seeds: [], edge: 'item', fallback: emptySchema<S>() }
        : { seeds: positionSeeds(view, idx), edge: 'tupleItem', fallback: item };
    }
  } else if (idx < 0 && isSchemaObject<S>(schema.items)) {
    return { seeds: seedsAt(view, ITEMS_KEY), edge: 'item', fallback: schema.items };
  }
  // Beside a list the items past it are `additionalItems`, as `getInnerSchemaForArrayItem()` reads them
  const restKey = isTupleSchema<S>(schema) ? getRestItemsKey<S>(schema) : ADDITIONAL_ITEMS_KEY;
  const rest: unknown = schema[restKey];
  if (additionalItems !== AdditionalItemsHandling.Ignore && isObject(rest)) {
    return { seeds: seedsAt(view, restKey), edge: 'item', fallback: rest };
  }
  return { seeds: [], edge: 'item', fallback: emptySchema<S>() };
}

/** The `null` fills to compute the defaults of a property of an object with: `nullFills` itself, or, for an optional
 * object the Optional Data Controls render collapsed (see `isCollapsedByOptionalDataControls()`), a copy marked
 * collapsed, see `NullFills.isCollapsed`
 *
 * @param context - The `SchemaContext` the defaults are computed in
 * @param child - The property's field
 * @param propertySchema - The property's schema as the object declares it
 * @param props - The property's own uiSchema, the `ui:definitions`, the call's `nullFills`, whether the object requires
 *        the property, the property's form data, and whether it is asked even where it holds no `null` schema, asked
 *        before the property is retrieved to ask whether the Optional Data Controls collapse it
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
    mayCollapse,
  }: Pick<FoldProps<T, S, F>, 'uiSchema' | 'uiSchemaDefinitions' | 'nullFills'> & {
    isRequired?: boolean;
    formData: unknown;
    mayCollapse?: () => boolean;
  },
): NullFills | undefined {
  const rootSchema = child.graph.rawRoot;
  const collapsedByControls = (fills: NullFills) =>
    isCollapsedByOptionalDataControls<T, S, F>(
      () => settle(context, { ...child, retrieves: true }, undefined, undefined).schema,
      propertySchema,
      uiSchema,
      {
        uiSchemaDefinitions,
        globalUiOptions: fills.globalUiOptions,
        rootSchema,
        required: isRequired === true,
        formData,
      },
    );
  const isCollapsed =
    nullFills !== undefined &&
    !nullFills.isCollapsed &&
    (mayHoldNullType(propertySchema, rootSchema)
      ? collapsedByControls(nullFills)
      : mayCollapse !== undefined && mayCollapse() && collapsedByControls(nullFills));
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
 * @param [fieldConst] - The object's `const`, as `foldView()` worked it out, read here for a call of its own
 * @param [givenConst] - The `const` whose value the object hands its properties, see `FoldProps.parentConst`
 * @param [reachesDefault=false] - Whether a declared default reaches `defaults`, which its properties inherit
 * @returns - The defaults of the object's properties
 */
function objectDefaults<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  props: FoldProps<T, S, F>,
  defaults: unknown,
  fieldConst?: FieldConst<S>,
  givenConst?: unknown,
  reachesDefault = false,
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
  const passes = props.passes ?? fieldPasses<S, F>(context, rootSchema, rawFormData);
  // The object `const` the field defaults to itself
  const ownObjectConst = (fieldConst ?? fieldConstOf<S, F>(context, view)).object;
  // An object `const` the field defaults to, its own or the value an ancestor's gives it. Where the fold leaves its value
  // out, it still closes the object to the keys it names, so a default of the object's for those keys is still seeded,
  // as the value it starts with
  const objectConst = ownObjectConst ?? (isObjectData(givenConst) ? givenConst : undefined);
  // `ObjectField` asks whether the user can add a key of the field as it renders it, retrieved for the data, its `allOf`
  // and `if` merged. An option's `const` is not its parent's: the field that renders the option's extra keys, its
  // parent's or, where the option offers options of its own, the option's, asks it of the parent with the option's
  // extra-key keywords joined to it. Only an object `const` changes what is computed from the answer: the field's own,
  // or an ancestor's that names a key the field declares no property for, as only such a key is filled as an extra key.
  // The retrieve and the join are spared every other field
  const readsRenderedField =
    ownObjectConst !== undefined ||
    (objectConst !== undefined &&
      Object.keys(objectConst).some((key) => !Object.hasOwn(view.schema.properties ?? {}, key)));
  const optionOf = readsRenderedField ? props.optionOf : undefined;
  // The field as `SchemaField` retrieves it, for the data the fold reads, which the branch `null` fill reads as well
  const retrievedView = () => passes.retrievedViewOf(view);
  let extraKeysField = view.schema;
  if (optionOf) {
    extraKeysField = joinOptionExtraKeys<S>(optionOf.parent(), optionOf.option());
  } else if (
    readsRenderedField &&
    !view.field.retrieves &&
    MERGING_KEYWORDS.some((keyword) => Object.hasOwn(view.schema, keyword))
  ) {
    extraKeysField = retrievedView().schema;
  }
  // Stubbing only adds properties, so whether the object takes extra keys is asked once, before it, of the field that
  // decides it, as is whether that field's absent keyword takes them
  const takesExtraKeys = allowsAdditionalProperties<S, F>(context, extraKeysField);
  const absentAllows = absentKeywordAllows<S, F>(context, extraKeysField);
  // A field resolved the way `retrieveSchema()` resolves a schema has the extra keys of its data stubbed among its
  // `properties`
  const schema =
    view.stubs && takesExtraKeys
      ? stubExistingAdditionalProperties<unknown, S, F>(context, view.schema, rootSchema, formData)
      : view.schema;
  // Under `constAsDefaults: 'always'` the object's own `const` takes precedence over the data, so an extra key it doesn't
  // name is dropped, whether the object stubs it among its properties or computes it from its `additionalProperties`.
  // An ancestor's `const` drops none: the field renders the controls that add the keys it doesn't name, so a key the
  // user adds is theirs, as the keys of an array row under the same `const` are
  const pinnedKeys = defaultFormStateBehavior?.constAsDefaults === 'always' ? ownObjectConst : undefined;
  const isPinned = (key: string) => !pinnedKeys || Object.hasOwn(pinnedKeys, key);
  const isDeclared = (key: string) => Object.hasOwn(schema.properties ?? {}, key);
  // A key of the `const` that a property of the field as rendered declares, of the option's as well for an option's
  // parent, is that property's, which its own field renders. Where the fold left the `allOf` or `if` declaring it
  // unmerged, it is folded here as that property, as `ObjectField` renders it
  const renderedSchemas =
    extraKeysField === view.schema ? [] : [extraKeysField, ...(optionOf ? [optionOf.option()] : [])];
  const unmergedProperties = new Map<string, S>();
  for (const key of Object.keys(objectConst ?? {})) {
    const rendered = isDeclared(key)
      ? undefined
      : renderedSchemas.find(({ properties }) => Object.hasOwn(properties ?? {}, key));
    const propertySchema = rendered && getPropertySchema<S>(rendered, key);
    if (propertySchema && !hasSchemaMarker(propertySchema, ADDITIONAL_PROPERTY_FLAG)) {
      unmergedProperties.set(key, propertySchema);
    }
  }
  const populatesAllOf = shouldPopulateAllOfDefaults<S>(view.schema, defaultFormStateBehavior);
  const computed: GenericObjectType = {};
  // Whether the property `key`, seeded by `seeds`, takes a `const`: one of its own, the object's `const` for it, or one
  // its `allOf` or unmerged `if`/`then` brings in, read from its schema merged for its data where a merge can reach
  // one, as the fold takes it. Worked out only where a default is added, as the data holds most keys on an edit, and
  // then once
  const constCheck = (key: string, graph: SchemaGraph<S>, seeds: readonly Seed[], readProperty: S) => {
    let holdsConst: boolean | undefined;
    return () => {
      holdsConst ??=
        defaultFormStateBehavior?.constAsDefaults !== 'never' &&
        !constIsAjvDataReference(readProperty) &&
        ((isObject(readProperty) && CONST_KEY in readProperty) ||
          (!props.leavesOutObjectConst && getByPath(objectConst, key) !== undefined) ||
          (isSchemaObject<S>(readProperty) &&
            mergedConstSchemaOf<S, F>(
              context,
              readProperty,
              formData[key],
              () => rootProvenance<S>(graph, seeds),
              (field) => retrieveField<S, F>(context, field, formData[key]),
            ) !== undefined));
      return holdsConst;
    };
  };
  const childProps = (key: string, uiSchemaKey: string, requiredKeys = schema.required) => ({
    includeUndefinedValues: includeUndefinedValues === true,
    parentDefaults: getByPath(defaults, key),
    inheritsDeclared: reachesDefault,
    parentConst: getByPath(givenConst, key),
    rawFormData: getByPath(formData, key),
    required: requiredKeys?.includes(key),
    shouldMergeDefaultsIntoFormData,
    initialDefaultsGenerated,
    uiSchema: getByPath<UiSchema<T, S, F> | undefined>(uiSchema, uiSchemaKey),
    uiSchemaDefinitions,
    nullFills,
    ...childPathProps<T, S, F>(props, key),
  });
  // Whether a declared default reached each key the object folded, see `reachedDefaultAt()`
  const reachedKeys = new Map<string, boolean>();
  // Computes the defaults of the child at `key`, reporting whether they hold a `null` fill and whether a declared
  // default reached them, which reaches the object too
  const foldReporting = (
    childContext: SchemaContext<S, F>,
    memoKey: string,
    child: DefaultsField<S>,
    childFoldProps: FoldProps<T, S, F>,
    key: string,
  ) => {
    let holdsNull = false;
    let takesObjectConst = false;
    let reachedDefault = false;
    const value = foldChild<T, S, F>(
      childContext,
      memoKey,
      child,
      {
        ...childFoldProps,
        onNullFill: () => {
          holdsNull = true;
        },
        onObjectConst: () => {
          takesObjectConst = true;
        },
        onReachedDefault: () => {
          reachedDefault = true;
        },
      },
      memo,
    );
    reachedKeys.set(key, reachedDefault || reachedKeys.get(key) === true);
    if (reachedDefault) {
      props.onReachedDefault?.();
    }
    return { value, holdsNull, takesObjectConst };
  };
  const propertyKeys = Object.keys(schema.properties ?? {}).filter(
    (key) => isPinned(key) || !hasSchemaMarker(getPropertySchema<S>(schema, key), ADDITIONAL_PROPERTY_FLAG),
  );
  // A key a property of an `allOf` the plan left unmerged declares, whatever the data, is no extra key of the field as
  // rendered, so it is folded through that property below and its default is the field's. A key only an unmerged
  // `then`, `else` or `dependencies` declares stays an extra key (#5816), as does one the merge leaves out, as it
  // leaves the `allOf`'s properties out beside `additionalProperties: false`. Each key is asked about in several places,
  // so it is worked out once per call, from the graph first, so the field is merged only for a key its `allOf` declares
  const allOfField = ALL_OF_KEY in view.schema ? fieldOfView<S>(view) : undefined;
  const allOfKeys = new Map<string, boolean>();
  let leftOutAdoptedKeys: ReadonlySet<string> | undefined;
  // A key only an option adopted from a list the `allOf` offers declares is left out where merging the field with the
  // keys only that option declares, as a member of its `allOf`, leaves it out, as the merge leaves out a key the `allOf`
  // declares itself. The seeds the option joins merge its keys as the field's own, which the field's extra-key keywords
  // say nothing about, so they are asked of that merge instead
  const forbidsAdoptedKey = (key: string) => {
    if (view.options.adopted === undefined) {
      return false;
    }
    if (leftOutAdoptedKeys === undefined) {
      const unadopted = mergedSchemaOf<S, F>(context, {
        ...view,
        options: { ...view.options, adopted: undefined },
        merged: {},
      });
      const unadoptedProperties = { ...unadopted.properties };
      const adoptedProperties = Object.fromEntries(
        Object.entries({ ...mergedSchemaOf<S, F>(context, view).properties }).filter(
          ([name]) => !Object.hasOwn(unadoptedProperties, name),
        ),
      );
      // A merge that fails leaves out every adopted key, as a failed merge of the `allOf` leaves out the keys it
      // declares itself: `mergeAllOf()` then drops the `allOf`. The built-in merger fails on a `type: 'null'` key beside
      // an `additionalProperties` schema of another type, which is how such a key is left out, as it is for a direct
      // `allOf`
      const withAdopted = mergeAllOf<S, F>(context, {
        ...withoutKeys(unadopted, ALL_OF_KEY),
        allOf: [{ properties: adoptedProperties }],
      });
      leftOutAdoptedKeys = new Set(
        Object.keys(adoptedProperties).filter((name) => !hasByPath(withAdopted, [PROPERTIES_KEY, name])),
      );
    }
    return leftOutAdoptedKeys.has(key);
  };
  const declaredInAllOf = (key: string) => {
    let declared = allOfKeys.get(key);
    if (declared === undefined) {
      declared =
        allOfField !== undefined &&
        allOfField.seeds.some(({ node }) => declaresUnconditionally<S>(allOfField.graph, node, key)) &&
        getByPath(mergedSchemaOf<S, F>(context, view).properties, key) !== undefined &&
        !forbidsAdoptedKey(key);
      allOfKeys.set(key, declared);
    }
    return declared;
  };
  const isComputed = (key: string) => isDeclared(key) || unmergedProperties.has(key) || declaredInAllOf(key);
  const ownProperties = [...propertyKeys, ...unmergedProperties.keys()].map((key) => {
    const skipsBranchDefaults = unmergedProperties.has(key);
    const propertySchema = unmergedProperties.get(key) ?? getPropertySchema<S>(schema, key);
    // A key the fold left unmerged has no seed under the object's `properties`, so it is seeded where the field as
    // `SchemaField` retrieves it declares it, its `$ref`, recursion and `dependencies` with it, rather than from the
    // `additionalProperties` or `patternProperties` its seeds in the fold would be
    const seeding = skipsBranchDefaults ? retrievedView() : view;
    const { seeds, edge } = childSeeds(seeding, key);
    // A property written as a `$ref` keeps its `const` and `type` in the definition it names, which is read where the
    // declaration holding that `$ref` sits, since a property declared twice is merged into one no graph holds
    const readProperty = isSchemaObject<S>(propertySchema)
      ? resolveMergedOwnRef<S>(view.graph, seeds, propertySchema, context.customMergeAllOf)
      : propertySchema;
    return {
      key,
      propertySchema,
      readProperty,
      hasConst: constCheck(key, view.graph, seeds, readProperty),
      child: defaultsChild(seeding, seeds, edge, propertySchema),
      declaredIn: schema,
      foldContext: context,
      skipsBranchDefaults,
    };
  });
  // A key only an `allOf` the plan left unmerged declares is a property of the field as rendered, so it takes the steps
  // a property of the object's own takes, from the property the merge for the data gives it. A boolean one names no
  // field of its own, so it is folded from no seeds, as an own property whose seeds are all booleans is. Only `allOf:
  // 'populateDefaults'` merges the `allOf`, so the `allOf`'s defaults, the key's own and those nested below it, are
  // skipped here, and one the data lacks is folded only where the object's default names it or a `const` gives it its
  // value, and otherwise takes only the `null` `branchNullFills()` finds for it
  // The key is seeded from the declarations the field's `allOf` holds, with the ref path that reaches them. A `$ref`
  // already on that path is not entered, as the defaults stop at any `$ref` already followed, so a key that only a
  // recursion through the `allOf` declares is not folded
  let allOfSeeding: Seeding<S> | undefined;
  // Only a key the data or the defaults name is folded, unless a `const` gives it its value: the object's, or one a
  // declaration of a property in the field's scope the object doesn't declare itself reaches, or one an option of its
  // `dependencies` brings in. Where none can, the keys are read off the data and the defaults, and the field is merged
  // only if the `allOf` declares one
  const constCanFill = ({ graph, seeds }: Provenance<S>) =>
    defaultFormStateBehavior?.constAsDefaults !== 'never' &&
    (objectConst !== undefined ||
      seeds.some(({ node }) => {
        const { dependencies, constKeys } = constFillersOf<S>(graph, node);
        return dependencies || constKeys.some((key) => !isDeclared(key));
      }));
  const allOfProperties =
    allOfField === undefined
      ? []
      : (constCanFill(allOfField)
          ? Object.keys(mergedSchemaOf<S, F>(context, view).properties ?? {})
          : Object.keys({ ...formData, ...(isObject(defaults) ? defaults : {}) })
        )
          .filter((key) => !isDeclared(key) && !unmergedProperties.has(key) && declaredInAllOf(key))
          .flatMap((key) => {
            allOfSeeding ??= buildPlan<S, F>({
              context,
              ...fieldOfView<S>(view),
              data: view.data,
              policy: { allOf: true, conditions: false, cutRecursion: true },
            });
            const { seeds, edge } = childSeeds(allOfSeeding, key);
            const mergedSchema = mergedSchemaOf<S, F>(context, view);
            const propertySchema = getPropertySchema<S>(mergedSchema, key);
            return edge === 'property'
              ? [
                  {
                    key,
                    propertySchema,
                    readProperty: propertySchema,
                    hasConst: constCheck(key, view.graph, seeds, propertySchema),
                    child: defaultsChild(view, seeds, edge),
                    declaredIn: mergedSchema,
                    foldContext: skippingDefaults(context),
                    skipsBranchDefaults: false,
                  },
                ]
              : [];
          })
          .filter(
            ({ key, hasConst }) => Object.hasOwn(formData, key) || getByPath(defaults, key) !== undefined || hasConst(),
          );
  // The keys the fold computes from a branch it left unmerged, which `branchNullFills()` leaves to them
  const foldedBranchKeys = new Set([...unmergedProperties.keys(), ...allOfProperties.map(({ key }) => key)]);
  for (const { key, propertySchema, readProperty, hasConst, child, declaredIn, foldContext, skipsBranchDefaults } of [
    ...ownProperties,
    ...allOfProperties,
  ]) {
    // A property stubbed by `stubExistingAdditionalProperties()` from `additionalProperties`/`patternProperties`
    // (flagged here, same as ObjectField's own rendering) shares `uiSchema.additionalProperties` with every other such
    // property, rather than a dynamically-named entry.
    const addedByAdditionalProperty = hasSchemaMarker(propertySchema, ADDITIONAL_PROPERTY_FLAG);
    const ownProps = childProps(key, addedByAdditionalProperty ? ADDITIONAL_PROPERTIES_KEY : key, declaredIn.required);
    // Only a property that may merge or show an object `const` can have one to leave out below. The walk is cached
    // per graph, so it is asked before the retrieve the Optional Data Controls' check needs
    let reachesConst: boolean | undefined;
    const mayHoldObjectConst = () => {
      reachesConst ??= reachesObjectConst<S>(child, defaultFormStateBehavior);
      return reachesConst;
    };
    // An optional object the Optional Data Controls render while it has no value renders none of its fields, so the
    // `null` of none of them is filled in until the user adds it
    const propertyNullFills = nullFillsForProperty<T, S, F>(context, child, propertySchema, {
      uiSchema: ownProps.uiSchema,
      uiSchemaDefinitions,
      nullFills,
      isRequired: ownProps.required,
      formData: ownProps.rawFormData,
      mayCollapse: mayHoldObjectConst,
    });
    // Whether the property's own object `const` is left out of its value
    let leavesOutConst = false;
    // A key the fold left unmerged has the defaults of the `allOf` or `if` declaring it skipped, as the plan skips
    // them: its field adds only its `null` fills, and the data, to the object's defaults for it, which its `const`
    // gives. The fills are those of the field holding that value, its `dependencies` and `if` read from it
    const foldProperty = (memoKey: string, foldProps: FoldProps<T, S, F>) => {
      if (!skipsBranchDefaults) {
        return foldReporting(foldContext, memoKey, child, foldProps, key);
      }
      const parentDefaults = ownValue(foldProps.parentDefaults);
      const over = (value: unknown) => {
        if (value === undefined) {
          return parentDefaults;
        }
        return isObject(parentDefaults) && isObject(value) ? mergeObjects(parentDefaults, value) : value;
      };
      const folded = foldReporting(
        skippingBranchDefaults(context),
        memoKey,
        child,
        { ...foldProps, rawFormData: over(foldProps.rawFormData) },
        key,
      );
      return { ...folded, value: parentDefaults === undefined && !folded.holdsNull ? undefined : over(folded.value) };
    };
    // Compute the defaults for this node, with the parent defaults we might have from a previous run: defaults[key].
    let property = foldProperty(propertyNullFills === nullFills ? `property:${key}` : `collapsed:${key}`, {
      ...ownProps,
      nullFills: propertyNullFills,
    });
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
        declaredIn.required,
        defaultFormStateBehavior?.emptyObjectFields,
        hasConst(),
      );
      if (isFormDataAvailable(added[key])) {
        // Such an object starts out without a value where only an object `const` gives it one, its own, a branch's or
        // its option's, as an empty default would: the `const` is its value once the user adds it. Whatever else gives
        // it a value, a default or `const` of its properties, a default of its own, a `ui:initialValue` or the
        // object's defaults, opens it as it opens any object. A fold that took no object `const` already computed its
        // value without
        let withoutConst = mayHoldObjectConst() && isObjectData(property.value) ? property : undefined;
        if (withoutConst && property.takesObjectConst) {
          withoutConst = foldProperty(`withoutConst:${key}`, {
            ...ownProps,
            nullFills: propertyNullFills,
            leavesOutObjectConst: true,
          });
        }
        const valueWithout = withoutConst?.value;
        if (
          withoutConst &&
          (valueWithout === undefined || (isObjectData(valueWithout) && Object.keys(valueWithout).length === 0))
        ) {
          property = withoutConst;
          leavesOutConst = true;
        } else {
          // The collapsed fold left out the `null` fills and the collapses of the optional objects inside, so the one
          // it opens is folded again as it renders
          property = foldProperty(`property:${key}`, ownProps);
        }
      }
    }
    if (property.holdsNull) {
      fillOverUndefined(nullFills, rawFormData, key, property.value);
    }

    if (shouldMergeDefaultsIntoFormData && Object.hasOwn(formData, key) && formData[key] !== undefined) {
      // A property the data holds is the user's, so it is kept with its defaults merged in, as its field computed it,
      // whatever the form's settings say about adding defaults. Where its field takes none of the data, an `allOf` the
      // property is read through decides object data holds nothing, as `populateDefaults` decides any value does,
      // object data its schema can't take is left out, and any other value is kept as the user left it, as a select
      // keeps a value its options no longer offer, its options in an `allOf` or not, and an extra key stubbed among the
      // properties keeps the data `extraKeyKeepsData()` says it does. A key only an unmerged `allOf` or `if` declares,
      // folded for its `null` fills alone, keeps its data where that fold gives it no value
      const dropsData =
        populatesAllOf || (isObject(readProperty) && ALL_OF_KEY in readProperty && isObjectData(formData[key]));
      const keepsData = addedByAdditionalProperty && extraKeyKeepsData(formData[key], property.value);
      if ((property.value !== undefined || dropsData) && !keepsData) {
        setOwn(computed, key, property.value);
      } else if (addedByAdditionalProperty || skipsBranchDefaults || !isObjectData(formData[key])) {
        setOwn(computed, key, formData[key]);
      }
    } else {
      maybeAddDefaultToObject(
        computed,
        key,
        property.value,
        includeUndefinedValues,
        required,
        declaredIn.required,
        defaultFormStateBehavior?.emptyObjectFields,
        hasConst() && !leavesOutConst,
        property.holdsNull,
      );
    }
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
    branchNullFills<T, S, F>(
      context,
      retrievedView(),
      schema,
      props,
      foldReporting,
      (key) => foldedBranchKeys.has(key) || forbidsAdoptedKey(key),
    ).forEach(({ key, value }) => {
      setOwn(computed, key, value);
      fillOverUndefined(nullFills, rawFormData, key, value);
      onNullFill?.();
    });
  }
  // Read from the field that decides whether the object takes extra keys, so the keys seeded are folded as it takes them,
  // seeded where the field as retrieved holds them where that is the field, settled only by a branch that seeds one
  const extraKeySeeding = () => (extraKeysField === view.schema ? view : retrievedView());
  const ownAdditionalProperties = absentAllows || extraKeysField.additionalProperties;
  const additionalProperties =
    extraKeysField !== view.schema ? passes.shareExtraKeySchema(ownAdditionalProperties) : ownAdditionalProperties;
  // An extra key is folded through the schemas that apply to it, as a validator applies them: in each chain, the
  // patterns of its own its name matches, else the keyword the object reads for the rest, its `additionalProperties`,
  // or its `unevaluatedProperties` where it names none.
  // A key the object rejects, a `false` among them, has no field, nor does one no pattern matches where no keyword
  // describes it and the context reads the absence as forbidding it, which `omitExtraData` prunes, unless the object's
  // `const` names it. The join of an option's keywords to its parent's isn't among the chains the key is seeded from,
  // so it is asked of the join
  const extraKeyword = additionalPropertiesKeywordName<S>(extraKeysField);
  const describesUnmatched = extraKeyword !== undefined || absentAllows;
  const extraKeyChild = (seeding: DefaultsView<S>, key: string) => {
    const { seeds, edge } = extraKeySeeds(seeding, key, extraKeyword);
    const rejected = optionOf
      ? getAdditionalPropertySchema<S>(extraKeysField, key) === false
      : seeds.some(({ node }) => {
          const seed = seeding.graph.node(node);
          return seed.kind === 'boolean' && !seed.value;
        });
    if (rejected || (edge !== 'patternKey' && !describesUnmatched && !Object.hasOwn(objectConst ?? {}, key))) {
      return undefined;
    }
    // as per spec additionalProperties may be either schema or boolean
    const fallback =
      edge === 'additionalKey' && isObject(additionalProperties) ? additionalProperties : emptySchema<S>();
    return defaultsChild(seeding, seeds, edge, fallback);
  };
  // An object `const` is the object's value as a whole, so the keys it names that no property declares are seeded as
  // extra keys are. Where the object takes no other extra key, ObjectField renders no control that adds, removes or
  // renames one, so the guards that keep a key the user removed or renamed from coming back don't hold back the keys the
  // `const` names. Where a `patternProperties` or `unevaluatedProperties` takes extra keys, the object isn't closed, and
  // the extra-key branch below seeds the `const`'s keys as it seeds a `default`'s. A `ui:initialValue` takes priority
  // over the `const` as the object's default, so beside one only the keys of the `const` it gives are seeded, read from
  // it on the first pass, the one it is the default of, as a declared key is. Only a key the defaults hold has a value
  // to seed
  const closingConst = takesExtraKeys ? undefined : objectConst;
  const readsInitialValue = closingConst && getUiOptions<T, S, F>(uiSchema).initialValue !== undefined;
  const constDefaults =
    closingConst && isObject(defaults) && !(readsInitialValue && initialDefaultsGenerated) ? defaults : undefined;
  // Where the `const` closes the object, nothing else seeds an extra key: `additionalProperties` is falsy there
  const closingKeys =
    closingConst && constDefaults
      ? new Set(Object.keys(closingConst).filter((key) => Object.hasOwn(constDefaults, key) && !isComputed(key)))
      : undefined;
  if (closingKeys) {
    for (const key of closingKeys) {
      // No field renders a key of a `const` that closes the object, so no user fills, clears or fixes it: the `const`
      // fills in what its data lacks on every pass, as on the first, a value held as `undefined` or `null` and the
      // items an array short of the `const`'s is missing included, at any depth, and keeps the rest of the data
      // Copied beside a `ui:initialValue`, since on the first pass the defaults are the uiSchema's own value; otherwise
      // they are the copy of the `const` the field made
      const ownDefault: unknown = getByPath(constDefaults, key);
      const keyDefault = readsInitialValue ? ownValue(ownDefault) : ownDefault;
      const keyData: unknown = getByPath(formData, key);
      const value = shouldMergeDefaultsIntoFormData ? fillFromConst(keyDefault, keyData) : keyDefault;
      maybeAddDefaultToObject(
        computed,
        key,
        value,
        includeUndefinedValues,
        required,
        [],
        'populateAllDefaults',
        // A `ui:initialValue` the object defaults to in place of the `const` can leave a key it names with no value
        value !== undefined,
      );
    }
  } else if (!initialDefaultsGenerated && takesExtraKeys) {
    const formDataRequired = Object.keys(formData).filter((key) => !isComputed(key));
    // Only seed keys from schema defaults when formData has no additionalProperties of its own.
    // If the user already has data (e.g. after a key rename), injecting default keys would
    // re-add stale entries that no longer exist in formData. A `const` is the object's whole value, so the keys it names
    // are seeded beside the data's on the first pass, whether or not the object's data is stubbed among its properties,
    // and only those, where a `ui:initialValue` is the defaults in its place
    const seeded = Object.keys(isObject(defaults) ? defaults : {}).filter(
      (key) => formDataRequired.length === 0 || Object.hasOwn(objectConst ?? {}, key),
    );
    const keys = new Set([...formDataRequired, ...seeded.filter((key) => !isComputed(key))]);
    const seeding = extraKeySeeding();
    [...keys].filter(isPinned).forEach((key) => {
      const child = extraKeyChild(seeding, key);
      if (child === undefined) {
        return;
      }
      const { value, holdsNull } = foldReporting(
        context,
        `additional:${key}`,
        child,
        // Matches ObjectField's convention for properties added by `additionalProperties`: they all share
        // `uiSchema.additionalProperties` rather than each having its own dynamically-named entry in `uiSchema`.
        childProps(key, ADDITIONAL_PROPERTIES_KEY),
        key,
      );
      // Added whatever the form's settings say, below, so its `null` only has to reach the objects above
      if (holdsNull) {
        fillOverUndefined(nullFills, rawFormData, key, value);
        onNullFill?.();
      }
      maybeAddDefaultToObject(
        computed,
        key,
        shouldMergeDefaultsIntoFormData && extraKeyKeepsData(formData[key], value) ? formData[key] : value,
        includeUndefinedValues,
        required,
        formDataRequired,
        // A property added by `additionalProperties` is one the user added, so it is populated whatever the form's
        // `emptyObjectFields` says about the properties the schema names
        'populateAllDefaults',
        value !== undefined && Object.hasOwn(objectConst ?? {}, key),
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
    const seeding = extraKeySeeding();
    const child = defaultsChild(
      seeding,
      seedsAt(seeding, ADDITIONAL_PROPERTIES_KEY),
      'additionalKey',
      additionalProperties,
    );
    Object.keys(formData)
      .filter((key) => !isComputed(key) && isPinned(key))
      .forEach((key) => {
        const { value, holdsNull } = foldReporting(
          nullsOnly,
          `additionalNull:${key}`,
          child,
          {
            rawFormData: getByPath(formData, key),
            initialDefaultsGenerated,
            uiSchema: getByPath<UiSchema<T, S, F> | undefined>(uiSchema, ADDITIONAL_PROPERTIES_KEY),
            uiSchemaDefinitions,
            nullFills,
            ...childPathProps<T, S, F>(props, key),
          },
          key,
        );
        if (holdsNull) {
          setOwn(computed, key, value);
          fillOverUndefined(nullFills, rawFormData, key, value);
          onNullFill?.();
        }
      });
  }
  // The data is the user's: a key it holds as `undefined` stays so unless `mergeDefaultsIntoFormData` says a default
  // replaces that and one does, and one no property names and no additional property was computed for is kept as it
  // is. A `null` it holds was kept or replaced by the field of the key, as in any other container. No field renders a
  // key of a `const` that closes the object for the user to clear, so one held as `undefined` takes the `const`
  if (shouldMergeDefaultsIntoFormData) {
    for (const key of Object.keys(formData)) {
      const value = formData[key];
      // A key the `allOf` declares is a property of the field, which a `const` that doesn't name it doesn't drop. One
      // only a recursion through the `allOf` declares, which isn't folded, keeps its data as an extra key does
      const isProperty = isDeclared(key) || foldedBranchKeys.has(key);
      const keptUndefined =
        value === undefined && !defaultReplacesUndefined(defaultFormStateBehavior) && !closingKeys?.has(key);
      const uncomputed = !Object.hasOwn(computed, key) && (value === undefined || !isProperty);
      if ((isPinned(key) || declaredInAllOf(key)) && (keptUndefined || uncomputed)) {
        setOwn(computed, key, value);
      }
    }
  }
  // A key a branch the plan left unmerged declares is computed among the properties, but the object it renders in
  // lists it after them in the data's order, as it lists an extra key, so the value keeps that order too
  const ordered = foldedBranchKeys.size > 0 ? inDataOrder(computed, formData, isDeclared) : computed;
  reachedDefaults.set(ordered, reachedKeys);
  // Object data is the user's, an empty one too, so a `null` default only stands in for an object they left none of
  if (shouldMergeDefaultsIntoFormData && isObjectData(rawFormData)) {
    return ordered;
  }
  return computeDefaultBasedOnSchemaTypeAndDefaults<unknown, S>(view.schema, ordered);
}

/** Whether a declared default reached each key of an object, or each index of an array, the fold built, by the value
 * it built
 */
const reachedDefaults = new WeakMap<object, ReadonlyMap<string | number, boolean>>();

/** Returns whether a declared default reached the value the fold built at `key` of `container`, a value it returned, see
 * `FoldProps.onReachedDefault`, or `undefined` where it didn't build `container` or didn't fold `key` into it
 *
 * @param container - An object or array the fold returned, or a value it wrote below one
 * @param key - The key or index
 * @returns - Whether a declared default reached the value there, where the fold knows
 */
export function reachedDefaultAt(container: unknown, key: string | number): boolean | undefined {
  // A value no fold built, a primitive included, has no record
  return reachedDefaults.get(container as object)?.get(key);
}

/** Returns `computed` with the keys `isDeclared` says the object declares first, as computed, then the keys `formData`
 * holds in its order, then the rest
 */
function inDataOrder(
  computed: GenericObjectType,
  formData: GenericObjectType,
  isDeclared: (key: string) => boolean,
): GenericObjectType {
  const ordered: GenericObjectType = {};
  const keys = Object.keys(computed);
  for (const key of [...keys.filter(isDeclared), ...Object.keys(formData), ...keys]) {
    if (Object.hasOwn(computed, key) && !Object.hasOwn(ordered, key)) {
      setOwn(ordered, key, computed[key]);
    }
  }
  return ordered;
}

/** Returns `value` without the keys none of `keeping` holds as its own
 *
 * @param value - The object value
 * @param keeping - The objects whose keys are kept
 * @returns - The value with only those keys
 */
function withoutKeysOutside(value: GenericObjectType, keeping: readonly unknown[]): GenericObjectType {
  const kept: GenericObjectType = {};
  for (const [key, entry] of Object.entries(value)) {
    if (keeping.some((keys) => isObject(keys) && Object.hasOwn(keys, key))) {
      setOwn(kept, key, entry);
    }
  }
  return kept;
}

/** Returns `data` with what it lacks of `constValue` filled in: a missing, `undefined`, `null` or `NaN` value takes the
 * `const`'s, an object takes the keys it lacks, at any depth, and an array whose items, so filled, are the `const`'s
 * first items is completed to the `const`'s. An array that differs is the user's, as is any other value
 *
 * @param constValue - The value the `const` gives
 * @param data - The data held for it
 * @returns - The data with the `const` filled in
 */
function fillFromConst(constValue: unknown, data: unknown): unknown {
  if (data === undefined || data === null || Number.isNaN(data)) {
    return constValue;
  }
  if (Array.isArray(constValue) && Array.isArray(data)) {
    if (data.length > constValue.length) {
      return data;
    }
    const filled: unknown[] = data.map((item: unknown, index) => fillFromConst(constValue[index], item));
    const prefix: unknown[] = constValue.slice(0, data.length);
    // Equal items keep the `const`'s identity, so a prefix of the `const` is the one `replaceEqualDeep()` hands back
    return replaceEqualDeep(prefix, filled) === prefix ? constValue : data;
  }
  if (isPlainObject(constValue) && isPlainObject(data)) {
    const filled: GenericObjectType = { ...data };
    for (const [key, value] of Object.entries(constValue)) {
      setOwn(filled, key, fillFromConst(value, getByPath(data, key)));
    }
    return filled;
  }
  return data;
}

/** Whether an extra key keeps the object data the user gave it over `value`, the value its field computed from that
 * data: object data its schema can't take is still the user's, whether the key is stubbed among the properties or
 * computed from the `additionalProperties`, and whether or not its schema has a default
 *
 * @param data - The extra key's data
 * @param value - The value the extra key's field computed
 * @returns - Whether the data is kept in place of `value`
 */
function extraKeyKeepsData(data: unknown, value: unknown): boolean {
  return isObjectData(data) && !isObjectData(value);
}

/** The `null` a missing value of a `null` schema is filled in as, for each property an `allOf` or `if` of the object
 * field `view` brings in that its plan left unmerged, and each of its own properties a branch makes `null`. The field
 * rendered for such a property renders all the same, from the schema `SchemaField` retrieves, and a `null` schema's one
 * value is the value it holds, so that `null` is added, with the objects that lead to it, and nothing else the
 * branches would default.
 *
 * @param context - The `SchemaContext` the defaults are computed in
 * @param retrieved - The object field's view as `SchemaField` retrieves it
 * @param schema - The object's schema, its extra keys stubbed where the field stubs them
 * @param props - The props of the object field
 * @param foldReporting - Computes a child's defaults, reporting whether they hold a `null` fill
 * @param skips - Whether the object's own fold already computed a property from the schema rendered for it, or leaves
 *        it out
 * @returns - The defaults of those properties that hold such a `null`
 */
function branchNullFills<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  retrieved: DefaultsView<S>,
  schema: S,
  props: FoldProps<T, S, F>,
  foldReporting: (
    childContext: SchemaContext<S, F>,
    memoKey: string,
    child: DefaultsField<S>,
    childFoldProps: FoldProps<T, S, F>,
    key: string,
  ) => { value: unknown; holdsNull: boolean },
  skips: (key: string) => boolean,
): { key: string; value: unknown }[] {
  const { rawFormData, uiSchema, uiSchemaDefinitions, nullFills } = props;
  const formData = isObject(rawFormData) ? rawFormData : {};
  const rendered = allowsAdditionalProperties<S, F>(context, retrieved.schema)
    ? stubExistingAdditionalProperties<unknown, S, F>(context, retrieved.schema, retrieved.graph.rawRoot, formData)
    : retrieved.schema;
  const nullsOnly = nullsOnlyContext(context);
  const ownProperties = schema.properties ?? {};
  return Object.keys(rendered.properties ?? {})
    .filter(
      (key) =>
        !skips(key) &&
        (!Object.hasOwn(ownProperties, key) ||
          (getSchemaType<S>(getPropertySchema<S>(rendered, key)) === 'null' &&
            getSchemaType<S>(getPropertySchema<S>(schema, key)) !== 'null')),
    )
    .flatMap((key) => {
      const propertySchema = getPropertySchema<S>(rendered, key);
      const { seeds, edge } = childSeeds(retrieved, key);
      const child = defaultsChild(retrieved, seeds, edge, propertySchema);
      const propertyFormData = getByPath(formData, key);
      // As the properties the object names read theirs, an additional property the retrieve stubbed sharing one entry
      const propertyUiSchema = getByPath<UiSchema<T, S, F> | undefined>(
        uiSchema,
        hasSchemaMarker(propertySchema, ADDITIONAL_PROPERTY_FLAG) ? ADDITIONAL_PROPERTIES_KEY : key,
      );
      const { value, holdsNull } = foldReporting(
        nullsOnly,
        `branch:${key}`,
        child,
        {
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
          ...childPathProps<T, S, F>(props, key),
        },
        key,
      );
      return holdsNull ? [{ key, value }] : [];
    });
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
 * @param [givenConst] - The `const` whose value the array hands its items, see `FoldProps.parentConst`
 * @param [reachesDefault=false] - Whether a declared default reaches `initialDefaults`, which its items inherit
 * @returns - The defaults of the array's items
 */
function arrayDefaults<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  props: FoldProps<T, S, F>,
  initialDefaults: unknown,
  givenConst?: unknown,
  reachesDefault = false,
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
  // Whether a declared default reached each item, which reaches the array too, see `reachedDefaultAt()`. A `minItems`
  // filler is recorded but doesn't reach the array: padding is no default of the array's
  const reachedItems = new Map<number, boolean>();
  const reportingFor = (idx: number, reachesArray = true) => {
    if (!reachedItems.has(idx)) {
      reachedItems.set(idx, false);
    }
    return () => {
      reachedItems.set(idx, true);
      if (reachesArray) {
        props.onReachedDefault?.();
      }
    };
  };
  const itemProps = (idx: number) => ({
    required,
    shouldMergeDefaultsIntoFormData,
    initialDefaultsGenerated,
    uiSchema: getStaticItemsUiSchema<T, S, F>(uiSchema, idx, schema),
    uiSchemaDefinitions,
    nullFills,
    inheritsDeclared: reachesDefault,
    onReachedDefault: reportingFor(idx),
    ...childPathProps<T, S, F>(props, idx),
  });

  // If the populate 'requiredOnly' flag is set then we only merge and include extra defaults if they are required.
  // Or if populate 'all' is set we merge and include extra defaults.
  const mergeExtraDefaults = ((ignoreMinItemsFlagSet && required) || isPopulateAll) && arrayMergeExtraDefaults;

  // Inject defaults into existing array defaults
  if (Array.isArray(defaults)) {
    const rows = Array.isArray(rawFormData) ? rawFormData : undefined;
    // The merge with the data below drops the items of the default past its rows, so they are not computed
    const kept = rows && !mergeExtraDefaults ? defaults.slice(0, rows.length) : defaults;
    // A tuple's `items` describes the items past it, read as the `additionalItems` beside a tuple `items` are
    const hasItemsSchema = getPrefixLength<S>(schema) === 0 && isSchemaObject<S>(schema.items);
    // Only an `items` schema has defaults to fill an item with, and `populate: 'never'` fills no row the data holds
    // with them: without either the item stays the copy it is
    const fillsItems = !neverPopulate && hasItemsSchema;
    defaults = kept.map((item: unknown, idx) => {
      const isHeld = rows !== undefined && idx < rows.length;
      // An item an `items` schema describes is no item past a tuple, which is all `additionalItems` describes, so it is
      // read against no schema here, which applies its uiSchema, a `ui:initialValue` included, as over any default
      const stated = foldChild<T, S, F>(
        context,
        `default:${idx}`,
        itemField(view, hasItemsSchema ? AdditionalItemsHandling.Ignore : AdditionalItemsHandling.Fallback, idx),
        {
          ...itemProps(idx),
          parentDefaults: item,
          parentConst: getByPath(givenConst, idx),
          rawFormData: rows?.[idx],
          // An item the data holds is one a field renders
          onNullFill: isHeld ? onNullFill : undefined,
        },
        memo,
      );
      if (!fillsItems || isHeld) {
        return stated;
      }
      // An item of the default no row of the data stands for is filled as the row holding it will be once the data
      // does (#5831): what it states is that row's data, merged in as the form merges it even for a caller computing
      // the defaults alone, so they agree on it, and then over the row as the array's data is, which keeps a value the
      // items' schema rejects
      const row = foldChild<T, S, F>(
        context,
        `defaultRow:${idx}`,
        itemField(view, AdditionalItemsHandling.Ignore),
        {
          ...itemProps(idx),
          rawFormData: stated,
          parentDefaults: stated,
          parentConst: getByPath(givenConst, idx),
          shouldMergeDefaultsIntoFormData: true,
        },
        memo,
      );
      return mergeDefaultsWithFormData(row, stated, mergeExtraDefaults, true);
    });
  }

  // Deeply inject defaults into already existing form data
  if (Array.isArray(rawFormData)) {
    if (neverPopulate) {
      defaults = rawFormData;
    } else {
      // A row of a `prefixItems` tuple is filled from its position, or past them from the `items` beside it, as a list's
      // rows are from its `items`, whether or not the array's own `default` skipped the tuple fill
      const isPrefixTuple = Array.isArray(schema.prefixItems);
      const itemDefaults = rawFormData.map((item: unknown, idx) =>
        foldChild<T, S, F>(
          context,
          `row:${idx}`,
          isPrefixTuple
            ? itemField(view, AdditionalItemsHandling.Fallback, idx)
            : itemField(view, AdditionalItemsHandling.Ignore),
          // An item the data holds is one a field renders
          {
            ...itemProps(idx),
            rawFormData: item,
            parentDefaults: getByPath(defaults, idx),
            parentConst: getByPath(givenConst, idx),
            onNullFill,
          },
          memo,
        ),
      );

      defaults = mergeDefaultsWithFormData(defaults, itemDefaults, mergeExtraDefaults);
    }
  }

  const defaultsLength = Array.isArray(defaults) ? defaults.length : 0;
  // The items the fold folded so far, which every array it returns is read by
  if (Array.isArray(defaults)) {
    reachedDefaults.set(defaults, reachedItems);
  }

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
  // Padding fills each item with the default the fill skips, so a field read without its defaults is left as given
  if (
    !schema.minItems ||
    SKIPS_DEFAULTS in context ||
    isMultiSelect<T, S, F>(context, withItems, rootSchema) ||
    computeSkipPopulate<S, F>(context, withItems, rootSchema) ||
    schema.minItems <= defaultsLength
  ) {
    // we don't want undefined defaults unless it is both not required or not required as root
    arrayDefault = defaults || (!required && !requiredAsRoot) ? defaults : emptyDefault;
  } else {
    const defaultEntries: unknown[] = Array.isArray(defaults) ? defaults : [];
    const isTuple = isTupleSchema<S>(schema);
    // A `false` tuple position allows no item, so no filler goes at or past it
    const openLength = getOpenPrefixLength<S>(schema);
    const fillLength =
      openLength < getPrefixLength<S>(schema) ? Math.min(schema.minItems, openLength) : schema.minItems;

    // Calculate filler entries for remaining items (minItems - existing raw data/defaults), each resolving the
    // schema and uiSchema for its own final position (`defaultsLength + i`) the same way `ArrayField` resolves it once
    // rendered, rather than sharing a single one across every filler row regardless of position.
    const fillerEntries = Array.from({ length: Math.max(fillLength - defaultsLength, 0) }, (_unused, i) => {
      const idx = isTuple ? defaultsLength + i : -1;
      return foldChild<T, S, F>(
        context,
        `filler:${i}`,
        itemField(view, AdditionalItemsHandling.Invert, idx),
        {
          ...itemProps(defaultsLength + i),
          parentDefaults: getInnerSchemaForArrayItem<S>(schema, AdditionalItemsHandling.Invert, idx).default,
          inheritsDeclared: false,
          onReachedDefault: reportingFor(defaultsLength + i, false),
        },
        memo,
      );
    });
    // then fill up the rest with either the item default or empty, up to minItems
    arrayDefault = defaultEntries.concat(fillerEntries);
  }
  if (Array.isArray(arrayDefault)) {
    reachedDefaults.set(arrayDefault, reachedItems);
  }
  return computeDefaultBasedOnSchemaTypeAndDefaults<unknown, S>(schema, arrayDefault);
}

type FoldedType = 'whole' | 'object' | 'array' | 'boolean' | 'primitive' | undefined;

/** How a field's defaults are computed: `'whole'` for a select over object or array constants, which holds one of
 * them as a whole, the field type `SchemaField` renders it as otherwise, `'primitive'` standing for any type whose
 * defaults are not computed from its contents, or `undefined` for an untyped field and for a `type` list holding, or
 * defaulting to, a value of another listed type than the object or array it renders, which is left as it is.
 *
 * @param context - The `SchemaContext`, whose `widgets` a `type` list's widget is read against
 * @param view - The field's view
 * @param props - The props of the field
 * @param defaults - The defaults computed for the field so far
 * @param [isWholeValue] - Whether the field is a select over whole object or array values, worked out from its
 *        schema where the caller hasn't already
 * @param [inheritsNull=false] - Whether `defaults` is an ancestor's `null` that won over the field's own default, which
 *        is the value the ancestor gives the field, held as a value of any other listed type is
 * @returns - The kind of value the field's defaults are computed as
 */
function foldedTypeOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  { uiSchema, rawFormData }: FoldProps<T, S, F>,
  defaults: unknown,
  isWholeValue = isWholeValueField<S, F>(context, view),
  inheritsNull = false,
): FoldedType {
  // A select over object or array constants picks one of them as a whole, so it has no contents of its own to fill in,
  // and an empty object or array would be a value none of its options allow
  if (isWholeValue) {
    return 'whole';
  }
  // A `ui:widget` that `SchemaField` renders through another listed type's field takes that type's default, so a
  // required `['null', 'boolean', 'string']` shown as a `textarea` isn't seeded with a `false` the textarea can't show.
  // A field whose `const` a merge brings in is typed from the schema it takes that `const` from, as a field is by a
  // `const` of its own, so an untyped field pinned to an object `const` is folded as an object
  const schema = constSchemaOf<S, F>(context, view);
  // A value of another type a `type` list names is left as it is, as `omitExtraData()` leaves it: an object held by a
  // `['null', 'array', 'object']` has no array items spread into it, and a `null` held by a `['null', 'object']` is not
  // filled in with the object's defaults. With no value, a default of another listed type is kept the same way, so a
  // `default: 'abc'` on a `['null', 'object', 'string']` isn't replaced by the object's. A field's own `null` default
  // is left to `computeDefaultBasedOnSchemaTypeAndDefaults()`
  const value = rawFormData === undefined && (defaults !== null || inheritsNull) ? defaults : rawFormData;
  const type = getFieldTypeForUiSchema<T, S, F>(schema, uiSchema, context.widgets, value);
  if (
    Array.isArray(schema.type) &&
    (type === 'object' || type === 'array') &&
    getSchemaTypeForValue<S>(schema, value) !== type
  ) {
    return undefined;
  }
  if (type === undefined || type === 'object' || type === 'array' || type === 'boolean') {
    return type;
  }
  return 'primitive';
}

/** Computes the default value based on the schema type.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param view - The field's view
 * @param props - The props of the field
 * @param defaults - The defaults computed for the field so far
 * @param type - The type the field's defaults are folded as, from `foldedTypeOf()`
 * @param [fieldConst] - The field's `const`, as `foldView()` worked it out
 * @param [givenConst] - The `const` whose value the field hands its children, see `FoldProps.parentConst`
 * @param [reachesDefault=false] - Whether a declared default reaches `defaults`, see `FoldProps.inheritsDeclared`
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
function typeDefaults<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  props: FoldProps<T, S, F>,
  defaults: unknown,
  type: FoldedType,
  fieldConst?: FieldConst<S>,
  givenConst?: unknown,
  reachesDefault = false,
): unknown {
  switch (type) {
    // A value already picked is kept as it is, since the form data is merged over the defaults key by key, which would
    // blend it with the default constant. A `null` value is one the user picked, so only a missing one falls back to
    // the default
    case 'whole': {
      return props.rawFormData === undefined ? defaults : props.rawFormData;
    }
    // We need to recurse for object schema inner default values.
    case 'object': {
      return objectDefaults<T, S, F>(context, view, props, defaults, fieldConst, givenConst, reachesDefault);
    }
    case 'array': {
      return arrayDefaults<T, S, F>(context, view, props, defaults, givenConst, reachesDefault);
    }
    case 'boolean': {
      // A required boolean with no explicit default gets false — it must be
      // present in the submitted data, and false is the natural zero-value.
      // `requiredBooleanDefault: 'skip'` opts out for forms that treat an
      // unanswered boolean as a distinct state and rely on `required` to flag it.
      const requiredBooleanDefault = context.defaultFormStateBehavior?.requiredBooleanDefault;
      if (
        requiredBooleanDefault !== 'skip' &&
        !(SKIPS_DEFAULTS in context) &&
        props.required &&
        defaults === undefined
      ) {
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
 * @testSeam Exported for utils' own tests
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
  return asDeclared<T | T[] | null | undefined>(foldField<T, S, F>(context, field, inputProps));
}

/** What the defaults fill a field holding no data with, and what the field hands its children, see `fieldFillOf()` */
export interface FilledField extends HandedDown {
  /** The value the field is filled with */
  readonly value: unknown;
  /** Whether a declared default reached the value, see `FoldProps.onReachedDefault` */
  readonly reachedDefault: boolean;
}

/** Returns what the defaults fill the field `schema` describes with when it holds no data, given `fill`, what they
 * hand it, and what it hands its children for them to fill theirs by, as `computeDefaults()` computes them. A schema
 * `retrieveSchema()` handed out is filled as it reads, with the conditions, `dependencies` and options it merged for
 * the data it was retrieved for: the field holds no data, but the fields around it do
 *
 * @param context - The `SchemaContext` the defaults are computed under
 * @param schema - The field's schema, as it is or as retrieved
 * @param rootSchema - The root schema `schema` is resolved against
 * @param fill - What the defaults hand the field
 * @returns - The field's value and what it hands its children
 */
export function fieldFillOf<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  rootSchema: S,
  fill: FieldFill,
): FilledField {
  let handedDown: HandedDown = { defaults: undefined, givenConst: undefined };
  let reachedDefault = false;
  // A handed-out schema stands for the field it was retrieved from, which the fold would plan again with no data. A copy
  // is planned from its own keywords, in the field's place, so its `$ref`s resolve where they were written
  const read = isHandedOut(schema) ? { ...schema } : schema;
  const parentDefaults = fill.inheritedDefault;
  const value = foldField<unknown, S, F>(context, callRoot<S>(rootSchema, read), {
    parentDefaults,
    // What a fill hands down is what its field's own defaults gave it, see `FieldFill.inheritedDefault`
    inheritsDeclared: parentDefaults !== undefined,
    parentConst: fill.inheritedConst,
    required: fill.isRequired,
    onHandDown: (defaults, givenConst) => {
      handedDown = { defaults, givenConst };
    },
    onReachedDefault: () => {
      reachedDefault = true;
    },
  });
  return { value: asDeclared(value), ...handedDown, reachedDefault };
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
 * @testSeam Exported for utils' own tests
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
 * @testSeam Exported for utils' own tests
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
 * @testSeam Exported for utils' own tests
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
      foldedTypeOf<T, S, F>(context, view, computeDefaultsProps, defaults, isWholeValue),
    ),
  );
}

/**
 * Ensure that the formData matches the given schema. If it's not matching in the case of a selectField, we change it to match the schema.
 * Object data a schema whose types leave out `object` holds can never match it, so it is dropped, at the top and at
 * any depth of object data, where the property is left out for the defaults to fill in.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which the formData state is desired
 * @param rootSchema - The root schema, used to primarily to look up `$ref`s
 * @param formData - The current formData
 * @returns - valid formData that matches schema
 * @testSeam Exported for utils' own tests
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

/** The schema of the field `view` stands for, merged as `retrieveSchema()` merges it for the data the view was planned
 * with, its conditions and `dependencies` decided by the view's dependency data, as its plan's are. The fold, the
 * object defaults and the data match of a field all read it, so it is merged once for them
 */
function mergedSchemaOf<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
): S {
  const { merged } = view;
  if (merged.schema === undefined || merged.context !== context) {
    const field = fieldOfView<S>(view);
    const root = parseSchemaGraph<S>(field.graph.rawRoot);
    merged.schema = retrieveRead<S, F>(context, root, field, view.data, view.depData, (merged.readers ??= []));
    merged.context = context;
  }
  return merged.schema;
}

/** Returns `field` as `retrieveFieldFor()` retrieves it in `root`, and adds the plan of the retrieve to `readers`: the
 * fixed point of the field reads what every retrieve made for it decided, as it reads what its own plan decided
 */
function retrieveRead<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  root: SchemaGraph<S>,
  field: Provenance<S>,
  data: unknown,
  depData: unknown,
  readers: Reader<S>[],
): S {
  const { schema, plan } = retrieveFieldFor<S, F>(context, root, field, data, depData);
  readers.push(plan);
  return schema;
}

/** The schema whose `const` the field `view` stands for takes: the merged one where `mergedConstSchemaOf()` gives one,
 * else the field as it stands
 */
function constSchemaOf<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
): S {
  // Read by the fold, the object defaults and the fold's type for one view, so it is worked out once for the view
  const { merged } = view;
  if (merged.constSchema === undefined || merged.constContext !== context) {
    merged.constSchema =
      mergedConstSchemaOf<S, F>(
        context,
        view.schema,
        view.depData,
        () => fieldOfView<S>(view),
        () => mergedSchemaOf<S, F>(context, view),
        () => {
          merged.readers ??= [];
          merged.readers.push({ graph: view.graph, entries: [], checked: [], choices: [], present: false });
        },
      ) ?? view.schema;
    merged.constContext = context;
  }
  return merged.constSchema;
}

/** The schema of a field, `schema` as written, merged for its `data` by `merge`, where that brings in a `const`. A
 * `const` a merging keyword the plan left unmerged brings in is the field's as one of its own is: it fills the field
 * under any `constAsDefaults` but `'never'`, and under `'always'` takes precedence over the data. So it is read from the
 * merged schema, so that a condition on the data picks the `const`, as `formDataMatching()` reads it. A merged schema
 * left with no `const`, as where the branch holding it isn't taken, gives the field none. A field that holds no data
 * gives a condition nothing to test, so no `then`/`else` gives it a `const`, and `onAbsent` is told where one would
 * have
 */
function mergedConstSchemaOf<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  schema: S,
  data: unknown,
  field: () => Provenance<S>,
  merge: (field: Provenance<S>) => S,
  onAbsent?: () => void,
): S | undefined {
  if (context.defaultFormStateBehavior?.constAsDefaults === 'never' || !holdsAnyOf(schema, MERGING_KEYWORDS)) {
    return undefined;
  }
  const provenance = field();
  const { graph, seeds } = provenance;
  if (!seeds.some(({ node }) => mergeReachesConst<S>(graph, node, false, data !== undefined))) {
    if (data === undefined && onAbsent && seeds.some(({ node }) => mergeReachesConst<S>(graph, node, false, true))) {
      onAbsent();
    }
    return undefined;
  }
  const mergedSchema = merge(provenance);
  return constValueOf<S>(mergedSchema) === undefined ? undefined : mergedSchema;
}

/** Returns a walk over a graph whose nodes each reach something or not, as Tarjan's strongly connected components walk
 * it, which answers whether the node `keys` names reaches what `reach` looks for, worked out once per node. It holds
 * the answers worked out, or for a node still open its place in `open`, the keys of the nodes walked whose answer is
 * still open, in the order they were entered, and the lowest place in that list the node being walked leads back to. A
 * node still open leads back into the cycle being walked, which settles only at its first node, so it reads as reaching
 * nothing meanwhile, and the answer is the same whichever node of a cycle is asked first
 */
function reachWalk(): (keys: readonly unknown[], reach: () => boolean) => boolean {
  const answers = new KeyedMemo<boolean | number | undefined>();
  const open: (readonly unknown[])[] = [];
  let low = Infinity;
  return (keys, reach) => {
    const known = answers.peek(keys);
    if (typeof known === 'boolean') {
      return known;
    }
    if (known !== undefined) {
      low = Math.min(low, known);
      return false;
    }
    const place = open.length;
    const outerLow = low;
    open.push(keys);
    answers.set(keys, place);
    low = place;
    let reaches: boolean | undefined;
    try {
      reaches = reach();
      return reaches;
    } finally {
      // Every node entered after this one and still open leads back to a node on the path to this one, so it reaches
      // what this one reaches: a find settles them all, and a graph that throws leaves them all to be walked again.
      // None found settles only once nothing below leads back above this node, which makes it the first node of its
      // cycle; until then it stays open with the rest, and its caller leads back as far as it does
      const innerLow = low;
      if (reaches !== false || innerLow === place) {
        open.splice(place).forEach((waiting) => answers.set(waiting, reaches));
      }
      low = reaches === false && innerLow < place ? Math.min(outerLow, innerLow) : outerLow;
    }
  };
}

/** What in the scope of a node, see `scopeOf()`, can give a key of its object a `const`: whether a declaration in it
 * holds `dependencies`, whose options can bring one in, and the keys of the properties it declares whose merge reaches
 * one, worked out once per graph and node
 */
const constFillers = new KeyedMemo<{ dependencies: boolean; constKeys: readonly string[] }>();
function constFillersOf<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, node: NodeId) {
  return constFillers.get([graph, node], () => {
    const scope = scopeOf<S>(graph, node);
    return {
      dependencies: scope.some(({ raw }) => Object.hasOwn(raw, DEPENDENCIES_KEY)),
      constKeys: scope.flatMap(({ id }) =>
        graph
          .subschemas(id, PROPERTIES_KEY)
          .filter(([, property]) => mergeReachesConst<S>(graph, property))
          .map(([key]) => key),
      ),
    };
  });
}

const constWalk = reachWalk();

/** Whether any subschema retrieving the node `from` may merge in declares a `const`: one its `$ref` and `allOf` merge
 * in, see `scopeOf()`, or one its `then`/`else` and `dependencies` subschemas reach in turn, but no `if`, a condition
 * never merged into the field. Retrieving a field merges an `anyOf`/`oneOf` option in only beside `dependencies` its
 * `$ref` and `allOf` merge in, or in a `dependencies` entry, so options are read only there, and below an option so
 * merged (`withOptions`). A merge for no data reads no `then`/`else` (`withConditions`). A merge brings in no `const`
 * none of them declares, so where none does the field's schema is read without being merged
 *
 * @testSeam Exported for utils' own tests
 */
export function mergeReachesConst<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  from: NodeId,
  withOptions = false,
  withConditions = true,
): boolean {
  return constWalk([graph, from, withOptions, withConditions], () => {
    const group = scopeOf<S>(graph, from, 'unconditional');
    // The `dependencies` entries are always merged in, an option only of a list beside `dependencies`
    const mergedLists =
      withOptions || group.some((node) => Object.hasOwn(node.raw, DEPENDENCIES_KEY))
        ? [ANY_OF_KEY, ONE_OF_KEY, DEPENDENCIES_KEY]
        : [DEPENDENCIES_KEY];
    const reachesAny = (subschemas: (NodeId | undefined)[], options: boolean) =>
      subschemas.some((sub) => sub !== undefined && mergeReachesConst<S>(graph, sub, options, withConditions));
    return group.some(
      (node) =>
        Object.hasOwn(node.raw, CONST_KEY) ||
        (withConditions && reachesAny([graph.child(node.id, THEN_KEY), graph.child(node.id, ELSE_KEY)], withOptions)) ||
        reachesAny(
          mergedLists.flatMap((keyword) => graph.subschemas(node.id, keyword).map(([, sub]) => sub)),
          true,
        ),
    );
  });
}

/** Whether the field `view` stands for is a select over whole object or array values, see `isWholeValueSelect()`. Options
 * an `allOf` brings in make the field a select as options of its own do, whatever the data, so an `allOf` the plan left
 * unmerged is merged for no data to ask, once for the view, and only where a subschema it merges in offers options
 */
function isWholeValueField<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
): boolean {
  const { merged } = view;
  if (merged.wholeValue === undefined || merged.wholeContext !== context) {
    const field = optionsMergedField<S, F>(context, view, [ENUM_KEY, ONE_OF_KEY, ANY_OF_KEY]);
    const { schema, seeding } = field ?? { schema: view.schema, seeding: view };
    merged.wholeValue = isWholeValueSelect<S>(resolveDeclaredConstantOptions<S>(schema, () => seeding));
    merged.wholeContext = context;
  }
  return merged.wholeValue;
}

/** The field of `view` with the `allOf` its plan left unmerged merged for no data, where a subschema that merges in,
 * not one of the field's own seeds, holds any of the keywords `offers`, and the `anyOf`/`oneOf` lists the merge met
 * that the field may still choose from. A list the field has chosen from already, or chosen an option of where an
 * `allOf` offers it, is closed: the field's seeds bring it back, though `foldView()` doesn't offer it again, so a
 * keyword only such lists hold is left out of the merge, where it would hide the list of the other keyword
 */
function optionsMergedField<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  offers: readonly string[],
): { schema: S; seeding: Seeding<S>; open: readonly OptionChoice[] } | undefined {
  if (!(ALL_OF_KEY in view.schema)) {
    return undefined;
  }
  const field = fieldOfView<S>(view);
  const ownSeeds = new Set(view.field.seeds.map(({ node }) => node));
  const mergesOptions = field.seeds.some(({ node }) =>
    scopeOf<S>(field.graph, node, 'unconditional').some(
      (merged) => !ownSeeds.has(merged.id) && holdsAnyOf(merged.raw, offers),
    ),
  );
  if (!mergesOptions) {
    return undefined;
  }
  const plan = buildPlan<S, F>({ context, ...field, policy: { allOf: true, conditions: false } });
  const { chosen, adopted } = view.options;
  const isClosed = ({ provider, list }: OptionChoice) => chosen.has(list) || adopted?.has(provider) === true;
  const closedKeys = OPTION_KEYWORDS.filter((keyword) => {
    const lists = plan.choices.filter((choice) => choice.keyword === keyword);
    return lists.length > 0 && lists.every(isClosed);
  });
  return {
    schema: closedKeys.length > 0 ? withoutKeys(plan.schema, ...closedKeys) : plan.schema,
    seeding: { graph: plan.graph, chains: plan.chains },
    open: plan.choices.filter((choice) => !isClosed(choice)),
  };
}

/** A list of `anyOf`/`oneOf` options an `allOf` the field's plan left unmerged offers, see `adoptableList()`: the
 * options, the field's schema offering them with the field's own `default`, and the list as the merge met it
 */
interface AdoptableList<S extends StrictRJSFSchema> {
  readonly list: XxxOfOptions<S>;
  readonly offering: OfferingSchema<S>;
  readonly choice: OptionChoice;
}

/** The list of `anyOf`/`oneOf` options an `allOf` the field's plan left unmerged offers the field, as `allOf:
 * 'populateDefaults'` offers it: the field offers it as one of its own, choosing the option it shows by its own
 * `default` and its data, and `foldOption()` seeds the field with that option where the `allOf` sits. So the fold reads
 * the option as it reads the rest of that `allOf`: its `const`, and that of a key only it declares, is the field's, as
 * one the `allOf` holds itself is, and so is each key it declares, which keeps that key of the field's defaults, while
 * its `default`s, its `required` and its recursion stay skipped. The option is the one the field shows, scored over the
 * list the field renders, see `rebuiltOptionPick()`. An `anyOf` is offered before a `oneOf`, as the field renders them;
 * one a `dependencies` entry offers is chosen by the plan.
 * Each list is offered by itself, so of two the `allOf` merges under one keyword each is chosen from in turn. That is
 * where it parts from `populateDefaults`: a `oneOf` the merge brings beside an `anyOf` of the field's own is chosen from
 * once the field has chosen its option, where `populateDefaults` reads only the `anyOf`, as for a field offering both
 * lists itself
 */
function adoptableList<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
): AdoptableList<S> | undefined {
  if (view.collapsed) {
    return undefined;
  }
  const field = optionsMergedField<S, F>(context, view, OPTION_KEYWORDS);
  // A list the merge leaves out, as a `customMergeAllOf` may, is not offered, as the merged field doesn't render it
  const offered = field?.open.filter(
    ({ dependencies, keyword }) => !dependencies && field.schema[keyword] !== undefined,
  );
  const choice = offered?.find(({ keyword }) => keyword === ANY_OF_KEY) ?? offered?.[0];
  if (field === undefined || choice === undefined) {
    return undefined;
  }
  // The option is chosen by the field's own `default`, not one the `allOf` holds, and an `anyOf` beside would be read
  // in place of the `oneOf`, while a `oneOf` beside an `anyOf` still skips its constants under `skipOneOf`
  const hidden = choice.keyword === ONE_OF_KEY ? [DEFAULT_KEY, ANY_OF_KEY] : [DEFAULT_KEY];
  const withList: S = { ...withoutKeys(field.schema, ...hidden), [choice.keyword]: choice.list };
  const schema = DEFAULT_KEY in view.schema ? { ...withList, [DEFAULT_KEY]: view.schema[DEFAULT_KEY] } : withList;
  const list = getXxxOfOptions<S>(schema);
  return list && { list, offering: { ...field.seeding, schema }, choice };
}

/** The field `view` stands for, see `viewField()`, built once for the view */
function fieldOfView<S extends StrictRJSFSchema>(view: DefaultsView<S>): Provenance<S> {
  const { merged } = view;
  merged.field ??= viewField<S>(view);
  return merged.field;
}

/** The value the `const` of `schema` gives a field, none for an AJV `$data` one, which names another value of the data
 * rather than being one
 */
function constValueOf<S extends StrictRJSFSchema>(schema: S): unknown {
  return constIsAjvDataReference<S>(schema) ? undefined : schema[CONST_KEY];
}

/** The field `view` stands for: its schema holds the options the fold selected for it, so the field is seeded by them
 * too, each merged over the field's own seeds as the fold merged it
 */
function viewField<S extends StrictRJSFSchema>(view: DefaultsView<S>): Provenance<S> {
  return rootProvenance<S>(view.graph, [
    ...view.field.seeds,
    ...view.choices.flatMap(({ provider, options, refPath }): Seed[] => {
      const index = view.options.selections.get(provider);
      return index === undefined ? [] : [{ node: options[index], refPath, scope: [`o${options[index]}`] }];
    }),
    ...(view.options.adopted?.values() ?? []),
  ]);
}

/** `ensureFormDataMatchingSchema()` for the field `view` the fold computed, retrieved as `viewField()` gives it and
 * merged as `mergedSchemaOf()` merges it
 */
function viewFormDataMatching<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: DefaultsView<S>,
  formData: T | undefined,
  defaults?: unknown,
  held = true,
): T | T[] | undefined {
  const matched: MatchedSchema<S> = {
    schema: view.schema,
    field: () => fieldOfView<S>(view),
    chains: () => view.chains,
    retrieve: () => mergedSchemaOf<S, F>(context, view),
  };
  return (held ? heldDataMatching : formDataMatching)<T, S, F>(
    context,
    matched,
    view.graph.rawRoot,
    formData,
    false,
    () => defaults,
  );
}

/** `formDataMatching()` for the value a field holds in the form data. A `null` is how a cleared field holds its value,
 * so one the field's options leave out is still the user's, as the fold keeps it for a property it computes, where
 * `ensureFormDataMatchingSchema()` leaves it out as any other value the options leave out
 */
function heldDataMatching<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  matched: MatchedSchema<S>,
  rootSchema: S,
  formData: T | undefined,
  unfolded = false,
  readDefaults?: () => unknown,
): T | T[] | undefined {
  const matching = formDataMatching<T, S, F>(context, matched, rootSchema, formData, unfolded, readDefaults);
  return matching === undefined && formData === null ? formData : matching;
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
  /** Retrieves the field for the data matched, `retrieveField()` with that data where not given */
  readonly retrieve?: () => S;
}

/** Whether `value` is an object as JSON Schema reads data: a plain object, `null`-prototype ones included, with no
 * primitive value of its own. One with a `valueOf()` method of its own, as an object standing for a moment, dayjs or
 * Luxon value has to give its epoch, is that value to the date widgets `utcToLocal()` converts it for
 */
function isObjectData(value: unknown): value is Record<string, unknown> {
  return (
    isPlainObject(value) && !(Object.hasOwn(value, 'valueOf') && typeof Reflect.get(value, 'valueOf') === 'function')
  );
}

/** Whether the option at `index` of the `key` options of the field `view` stands for takes a value of the type `value`
 * has: a boolean option is what it says, and one written as a `$ref` is read as the definition it names, which is
 * where its type is
 */
function optionTakesValueOf<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  view: Seeding<S>,
  key: string,
  index: number,
  option: unknown,
  value: unknown,
): boolean {
  if (!isSchemaObject<S>(option)) {
    return option === true;
  }
  const { graph, node } = offeredOption<S>(view, key, index, option);
  const read = resolveMergedOwnRef<S>(graph, [{ node, refPath: [] }], option, context.customMergeAllOf);
  return takesValueOf<S>(read, value);
}

/** Whether `schema` takes a value of the type `value` has, as its own types say them, see `typeAllows()`. It decides
 * whether an ancestor's default can win under `nestedDefaultsPrecedence: 'ancestorWins'`
 */
function takesValueOf<S extends StrictRJSFSchema>(schema: S, value: unknown): boolean {
  return typeAllows(getSchemaOwnTypes<S>(schema), value);
}

/** Returns `formData` matched to `matched.schema` as `ensureFormDataMatchingSchema()` matches it. `unfolded` says the
 * fold computed none of the properties of the schema, as it computes none that a merge for the data brings in, nor any
 * nested in one, so each value of them is matched here, and `readDefaults` reads the field's defaults, see
 * `matchProperties()`
 */
function formDataMatching<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  matched: MatchedSchema<S>,
  rootSchema: S,
  formData: T | undefined,
  unfolded = false,
  readDefaults: () => unknown = () => undefined,
): T | T[] | undefined {
  const { schema, field, retrieve = () => retrieveField<S, F>(context, field(), formData) } = matched;
  const { defaultFormStateBehavior } = context;
  const shouldRetrieveAllOf = shouldPopulateAllOfDefaults(schema, defaultFormStateBehavior);
  const schemaToMatch = shouldRetrieveAllOf ? retrieve() : schema;
  const declarations = declarationsOf<S>(matched);
  // Without data there is nothing to check, so only data asks for the merged schema. A schema with nothing left to
  // merge is read as it stands, which is what retrieving it would give, as is one `populateDefaults` already retrieved
  // with the data. An `allOf` or `$ref` holds the options, types, `const` and properties the data is checked against in
  // its subschemas, so all four are read from the merged schema, retrieved with the data so that a condition on it
  // picks what it is checked against. A merge that reads no data is kept for any data, so only one whose result
  // depends on the data is planned again for it. A merge that leaves one value is a constant, whose data is kept as it
  // is for a field that declares one, as long as the field's own options take it: those of its schema as written where
  // `populateDefaults`, or the root's retrieval, already merged them away
  const mergesForData = !shouldRetrieveAllOf && formData !== undefined && holdsAnyOf(schemaToMatch, MERGING_KEYWORDS);
  const ownOptions = () => {
    if (formData === undefined) {
      return undefined;
    }
    const own = buildPlan<S, F>({ context, ...field(), policy: { allOf: false, conditions: false } }).schema;
    return isConstant<S>(own) ? undefined : own;
  };
  const readSchema = mergesForData ? retrieve() : schemaToMatch;
  const nestedUnfolded = unfolded || mergesForData;
  const optionsSchema = [readSchema, schemaToMatch].find((candidate) => !isConstant<S>(candidate)) ?? ownOptions();
  const selectSchema =
    formData === undefined || optionsSchema === undefined
      ? undefined
      : resolveDeclaredConstantOptions<S>(optionsSchema, declarations);
  let validFormData: unknown = formData;
  if (selectSchema !== undefined && isConstantSelect<S>(selectSchema, true)) {
    const getOptionsList = optionsList<T, S, F>(selectSchema);
    // An empty option list has no value to check the data against, so the data is kept, as it is without the list. An
    // option of object data that declares the discriminator is valued by that property, as `optionsList()` values it
    // and `LayoutMultiSchemaField` matches a pick by
    const selectorField = getDiscriminatorFieldFromSchema<S>(selectSchema);
    const selected = selectorField && isObjectData(formData) ? getByPath(formData, selectorField) : undefined;
    if (getOptionsList?.length !== 0) {
      validFormData = getOptionsList?.some(
        (option) =>
          deepEquals(option.value, formData) || (selected !== undefined && deepEquals(option.value, selected)),
      )
        ? formData
        : undefined;
    }
  } else if (isObjectData(formData) && !takesValueOf<S>(readSchema, formData)) {
    // Object data can never validate against a schema whose types leave out `object`, so it is no value of the field
    validFormData = undefined;
  }

  // Override the formData with the const if the constAsDefaults is set to always
  const fieldConst = defaultFormStateBehavior?.constAsDefaults === 'always' ? constValueOf<S>(readSchema) : undefined;
  if (fieldConst !== undefined) {
    validFormData = fieldConst;
  } else if (isObject(validFormData)) {
    validFormData = matchProperties<S, F>(context, readSchema, matched, declarations, rootSchema, validFormData, {
      unfolded: nestedUnfolded,
      retrievesAll: shouldRetrieveAllOf,
      readDefaults,
    });
  }

  return asDeclared<T | T[] | undefined>(validFormData);
}

/** The object data of a property that `matchProperties()` matched as it stands without reading the defaults, by the
 * context, the property's field and schema, the snapshot of the data, see `snapshotOf()`, and whether it is unfolded
 */
const keptObjects = new KeyedMemo<true>();

/** The snapshot of each object of form data a call matched, kept for as long as the object, and its copy in the state
 * the call handed back, live, see `snapshotOf()`
 */
const snapshotHints = new WeakMap<object, object>();

/** The snapshot of each object of the data of the `getDefaultFormState()` call under way that a match asked for, and of
 * each object in it, see `snapshotOf()`
 */
let callSnapshots: Map<object, object> | undefined;

/** Records, in `pairs`, the counterpart in `snapshot` of each array and plain object in `data`, by key */
function pairSnapshots(
  data: unknown,
  snapshot: unknown,
  pairs: Map<object, object> | WeakMap<object, object>,
  walked = new WeakSet<object>(),
): void {
  if (
    !(Array.isArray(data) || isPlainObject(data)) ||
    typeof snapshot !== 'object' ||
    snapshot === null ||
    walked.has(data)
  ) {
    return;
  }
  walked.add(data);
  pairs.set(data, snapshot);
  for (const [key, entry] of Object.entries(data)) {
    pairSnapshots(entry, Reflect.get(snapshot, key), pairs, walked);
  }
}

/** Points each object of `state`, the state a call handed back for `data`, at the snapshot taken of the object of
 * `data` in its place, and the objects in it at theirs, see `snapshotHints`. `Form` hands that state back with an edit,
 * whose objects a typed object field builds afresh, so the data a match took a snapshot of is not in it
 */
function hintState(data: unknown, state: unknown, snapshots: Map<object, object>, walked: WeakSet<object>): void {
  if (
    !(Array.isArray(data) || isPlainObject(data)) ||
    typeof state !== 'object' ||
    state === null ||
    walked.has(data)
  ) {
    return;
  }
  walked.add(data);
  const snapshot = snapshots.get(data);
  if (snapshot !== undefined) {
    pairSnapshots(state, snapshot, snapshotHints);
    return;
  }
  for (const [key, entry] of Object.entries(data)) {
    hintState(entry, Reflect.get(state, key), snapshots, walked);
  }
}

/** Returns what the snapshot of `data` is compared with: the snapshot its hint names, see `snapshotHints`, or else, for
 * an object or array an edit copied, one made of the snapshots its members' hints name, so only the objects on the
 * edited path are walked
 */
function previousSnapshotOf(data: unknown, walked: WeakSet<object>): unknown {
  if (!(Array.isArray(data) || isPlainObject(data)) || walked.has(data)) {
    return undefined;
  }
  const hint = snapshotHints.get(data);
  if (hint !== undefined) {
    return hint;
  }
  walked.add(data);
  return Array.isArray(data)
    ? data.map((item: unknown) => previousSnapshotOf(item, walked))
    : Object.fromEntries(Object.entries(data).map(([key, entry]) => [key, previousSnapshotOf(entry, walked)]));
}

/** Returns the snapshot of the object `data` of the call under way: a copy of it the fold owns, which shares every
 * subtree equal to the snapshot last taken of it, or of the state a call handed back for it, see
 * `previousSnapshotOf()`. A
 * match is keyed on the snapshot rather than on `data`, which the caller may change in place between calls, so an
 * object equal to one matched before is matched once. Only the object a match asks for is copied, with what it holds,
 * and the hint only says which snapshot to compare it with, so data changed in place gets a snapshot of its own
 */
function snapshotOf(data: object): object | undefined {
  if (callSnapshots === undefined) {
    return undefined;
  }
  let snapshot = callSnapshots.get(data);
  if (snapshot === undefined) {
    snapshot = replaceEqualDeep(previousSnapshotOf(data, new WeakSet()), ownValue(data));
    pairSnapshots(data, snapshot, callSnapshots);
  }
  return snapshot;
}

/** The declarations the properties of the schema `matched` stands for are read in */
function declarationsOf<S extends StrictRJSFSchema>({ field, chains }: MatchedSchema<S>): () => Seeding<S> {
  let declaredIn: Seeding<S> | undefined;
  return () => {
    declaredIn ??= { graph: field().graph, chains: chains() };
    return declaredIn;
  };
}

/** How `matchProperties()` matches the properties of object data */
interface PropertyMatch {
  /** Whether the fold computed none of the properties, see `formDataMatching()` */
  readonly unfolded: boolean;
  /** Whether every property is retrieved, as `allOf: 'populateDefaults'` retrieves them */
  readonly retrievesAll: boolean;
  /** Reads the object's defaults, which a value an unfolded property rejects may take, see `matchProperties()`. A match
   * reads them only through it, so a match can tell whether any match below it read them
   */
  readonly readDefaults: () => unknown;
}

/** Returns the object data `data` with each property `readSchema` declares matched to the schema of that property, as
 * `formDataMatching()` matches it, where it may reject the value: a value that doesn't match is left out, so the
 * property takes its defaults as one the data lacks does. `declarations` gives the declarations of `matchedSchema`, see
 * `declarationsOf()`, and `match` how the properties are matched. As the fold computes none of an unfolded property, a
 * value one rejects takes the object's default for it here, not its own, which sits in the merge the fold left out;
 * with none, a value that is no object is kept, as a select keeps one its options don't offer. A value that is no object
 * that a select over its own `anyOf`/`oneOf` constants doesn't offer is kept whatever defaults there are, as the fold
 * keeps it
 */
function matchProperties<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  readSchema: S,
  matchedSchema: MatchedSchema<S>,
  declarations: () => Seeding<S>,
  rootSchema: S,
  data: GenericObjectType,
  { unfolded, retrievesAll, readDefaults }: PropertyMatch,
): GenericObjectType {
  if (!isObject(readSchema.properties)) {
    return data;
  }
  const { field } = matchedSchema;
  // Data no property rejects is handed back as it is, so a match can tell it kept the data
  let matched: GenericObjectType = data;
  const changed = () => {
    if (matched === data) {
      matched = { ...data };
    }
    return matched;
  };
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
  // An extra key stubbed from `additionalProperties` keeps the data the user gave it, see `extraKeyKeepsData()`
  const matchedKeys = Object.keys(readSchema.properties).filter(
    (dataKey) =>
      Object.hasOwn(matched, dataKey) &&
      !hasSchemaMarker(getPropertySchema<S>(readSchema, dataKey), ADDITIONAL_PROPERTY_FLAG),
  );
  for (const key of matchedKeys) {
    const propertySchema = getPropertySchema<S>(readSchema, key);
    let propertyProvenance: Provenance<S> | undefined;
    const propertyField = () => {
      propertyProvenance ??= fieldOfProperty(key, propertySchema);
      return propertyProvenance;
    };
    // A property written as a `$ref` is matched as the definition it names, whose `allOf` it is
    let readProperty = propertySchema;
    if (isSchemaObject<S>(propertySchema) && typeof propertySchema[REF_KEY] === 'string') {
      const { graph, seeds } = propertyField();
      readProperty = resolveMergedOwnRef<S>(graph, seeds, propertySchema, context.customMergeAllOf);
    }
    const retrievesProperty = retrievesAll || (isObject(readProperty) && ALL_OF_KEY in readProperty);
    // Object data is matched at every depth, so a value nested in it that its schema can't take is found too, and so
    // is any other value the fold didn't compute that its schema may reject. A boolean schema has nothing to match the
    // data against
    const matchesNested =
      isSchemaObject<S>(readProperty) &&
      (isObjectData(matched[key]) ||
        (unfolded &&
          (holdsAnyOf(readProperty, REJECTING_KEYWORDS) ||
            (context.defaultFormStateBehavior?.constAsDefaults === 'always' && CONST_KEY in readProperty))));
    // A key the user left `undefined` holds no value to reject, so it stays, as the fold keeps it, whether or not the
    // property is read through an `allOf`
    if (matched[key] !== undefined && (retrievesProperty || matchesNested)) {
      const chainsOfProperty = () => {
        const { graph, seeds } = propertyField();
        return buildPlan<S, F>({ context, graph, seeds, policy: { allOf: false, conditions: false } }).chains;
      };
      const propertyData = matched[key];
      let readsDefaults = false;
      const readPropertyDefaults = () => {
        readsDefaults = true;
        return getByPath(readDefaults(), key);
      };
      const matchProperty = () =>
        heldDataMatching<unknown, S, F>(
          context,
          { schema: readProperty, field: propertyField, chains: chainsOfProperty },
          rootSchema,
          propertyData,
          unfolded,
          readPropertyDefaults,
        );
      // Object data is matched at every depth, on every call, so an object equal to one matched before, as the data
      // holds one after an edit elsewhere, is matched once. Only a match that kept the data as it stands without
      // reading the defaults is remembered, as that holds whatever defaults the next call gives
      const snapshot = isObjectData(propertyData) ? snapshotOf(propertyData) : undefined;
      let matchedProperty: unknown;
      if (snapshot === undefined) {
        matchedProperty = matchProperty();
      } else {
        const keptKeys = [context, propertyField(), readProperty, snapshot, unfolded];
        if (keptObjects.peek(keptKeys)) {
          matchedProperty = propertyData;
        } else {
          matchedProperty = matchProperty();
          if (matchedProperty === propertyData && !readsDefaults) {
            keptObjects.set(keptKeys, true);
          }
        }
      }
      // A value that doesn't match is left out, an `allOf` the property is read through or not, so the property takes
      // its defaults as one the data lacks does, here where the fold computes none for it
      let value = matchedProperty;
      if (value === undefined && unfolded) {
        // A `null` default is a default like any other, so only a missing one falls through. The property's own
        // default sits in the merge the fold left out, whose defaults are skipped
        const objectDefault = readPropertyDefaults();
        // A value that is no object is kept where there is no default to take its place, as the fold keeps it
        const kept = isObjectData(matched[key]) ? undefined : matched[key];
        value = objectDefault === undefined ? kept : objectDefault;
      }
      if (value === undefined) {
        Reflect.deleteProperty(changed(), key);
      } else if (!Object.is(value, matched[key])) {
        setOwn(changed(), key, value);
      }
    }
  }
  return matched;
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
    fieldState,
  }: GetDefaultFormStateProps<T, S, F>,
): T | T[] | null | undefined {
  if (!isObject(theSchema)) {
    // oxlint-disable-next-line typescript/no-base-to-string -- `JSON.stringify()` would throw for a circular array or a BigInt
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
    overUndefined: new KeysByObject(),
  };
  const outerSnapshots = callSnapshots;
  const snapshots = new Map<object, object>();
  callSnapshots = snapshots;
  let defaults: unknown;
  try {
    defaults = foldField<T, S, F>(context, field, {
      nullFills,
      includeUndefinedValues,
      rawFormData: formData,
      shouldMergeDefaultsIntoFormData: true,
      initialDefaultsGenerated,
      requiredAsRoot: true,
      uiSchema,
      uiSchemaDefinitions,
      fieldState,
    });
  } finally {
    callSnapshots = outerSnapshots;
  }
  if (!isObject(formData) && !Array.isArray(formData)) {
    return asDeclared<T | T[] | null | undefined>(defaults);
  }
  // Every field merged its own data into its defaults as it computed them, so they are the form's state as they stand.
  // A field keeps data it takes as it is, so the state is copied off the caller's data, which the caller may go on to
  // change, as the caller may change the state it is handed
  const state = ownValue(withNullFills(defaults, formData, nullFills));
  // The next call is handed the data again, or this state with an edit, so the objects of both point at the snapshots
  // taken of them
  if (snapshots.size > 0) {
    for (const [data, snapshot] of snapshots) {
      snapshotHints.set(data, snapshot);
    }
    hintState(formData, state, snapshots, new WeakSet());
  }
  return asDeclared<T | T[] | null | undefined>(state);
}
