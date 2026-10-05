import type { JSONSchema7Object } from 'json-schema';

import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ALL_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  DEPENDENCIES_KEY,
  IF_KEY,
  ONE_OF_KEY,
  REF_KEY,
  UI_DEFINITIONS_KEY,
} from '../constants.ts';
import constIsAjvDataReference from '../constIsAjvDataReference.ts';
import deepEquals from '../deepEquals.ts';
import findSchemaDefinition from '../findSchemaDefinition.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getOptionUiSchema from '../getOptionUiSchema.ts';
import getPropertySchema from '../getPropertySchema.ts';
import getSchemaType from '../getSchemaType.ts';
import getStaticItemsUiSchema from '../getStaticItemsUiSchema.ts';
import getUiOptions from '../getUiOptions.ts';
import { getFieldTypeForWidget } from '../getWidget.tsx';
import getXxxOfOptions from '../getXxxOfOptions.ts';
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
  RJSFMarkedSchema,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  UiSchema,
} from '../types.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import isMultiSelect from './isMultiSelect.ts';
import isSelect from './isSelect.ts';
import retrieveSchema, { resolveDependencies, retrieveSchemaInternal } from './retrieveSchema.ts';

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

/** Checks whether form data is undefined or an empty object.
 *
 * @param formData - The form data to inspect
 * @returns - True if there is no existing form data
 */
function isEmptyFormData(formData: unknown): boolean {
  return formData === undefined || (isObject(formData) && Object.keys(formData).length === 0);
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
  /** The list of ref names currently being recursed, used to prevent infinite recursion */
  _recurseList?: string[];
  /** Optional flag, if true, indicates this schema was required in the parent schema. */
  required?: boolean;
  /** Optional flag, if true, indicates this schema was required because it is the root. */
  requiredAsRoot?: boolean;
  /** Optional flag, if true, It will merge defaults into formData.
   *  The formData should take precedence unless it's not valid. This is useful when for example the value from formData does not exist in the schema 'enum' property, in such cases we take the value from the defaults because the value from the formData is not valid.
   */
  shouldMergeDefaultsIntoFormData?: boolean;
}

/** Computes the defaults for the current `schema` given the `rawFormData` and `parentDefaults` if any. This drills into
 * each level of the schema, recursively, to fill out every level of defaults provided by the schema.
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
  const { defaultFormStateBehavior } = context;
  const {
    parentDefaults,
    rawFormData,
    rootSchema = {} as S,
    includeUndefinedValues = false,
    _recurseList = [],
    required,
    shouldMergeDefaultsIntoFormData = false,
    initialDefaultsGenerated,
    uiSchema: localUiSchema,
    uiSchemaDefinitions,
  } = inputProps;
  // Apply `ui:definitions` at every node, keyed by the `$ref` `retrieveSchema()` recorded when it resolved this
  // node, so defaults see the same uiSchema `SchemaField` renders with.
  const uiSchema = uiSchemaDefinitions
    ? resolveUiSchema<T, S, F>(rawSchema, localUiSchema, { rootSchema, uiSchemaDefinitions })
    : localUiSchema;
  const computeDefaultsProps = uiSchema === localUiSchema ? inputProps : { ...inputProps, uiSchema };
  let formData: T = (isObject(rawFormData) ? rawFormData : {}) as T;
  const schema: S = isObject(rawSchema) ? rawSchema : ({} as S);
  // Compute the defaults recursively: give highest priority to deepest nodes unless nestedDefaultsPrecedence is ancestorWins.
  let defaults: T | T[] | null | undefined = parentDefaults;
  const preferParentDefaults = defaults && defaultFormStateBehavior?.nestedDefaultsPrecedence === 'ancestorWins';
  // If we get a new schema, then we need to recompute defaults again for the new schema found.
  let schemaToCompute: S | null = null;
  let contextToCompute = context;
  let updatedRecurseList = _recurseList;
  // Overridden below when a `oneOf`/`anyOf` branch is selected, so that branch's own `uiSchema[keyword][index]`
  // fragment (matching `MultiSchemaField`'s `optionsUiSchema`/`optionUiSchema`) is what its fields see, rather than
  // the parent uiSchema, which is otherwise passed straight through.
  let branchUiSchema = uiSchema;
  // Worked out by the `oneOf`/`anyOf` branch, so it isn't worked out again for this node's type-based default
  let isWholeValue: boolean | undefined;
  const xxxOf = getXxxOfOptions<S>(schema);
  if (
    schema[CONST_KEY] !== undefined &&
    defaultFormStateBehavior?.constAsDefaults !== 'never' &&
    !constIsAjvDataReference(schema)
  ) {
    defaults = schema[CONST_KEY] as unknown as T;
  } else if (
    isObject(defaults) &&
    isObject(schema.default) &&
    !xxxOf &&
    !schema[REF_KEY] &&
    !isWholeValueSelect<S>(schema)
  ) {
    // For object defaults, merge defaults by precedence setting.
    // Skip this for anyOf/oneOf/$ref schemas, which need special handling, and for a select over object constants,
    // whose own default and inherited default each name a whole constant, so a blend of them names none.
    if (preferParentDefaults) {
      // Use schema.default as the base and only override values that are defined in parent defaults.
      defaults = mergeObjects(schema.default, defaults) as T;
    } else {
      // Only override parent defaults that are defined in schema.default.
      defaults = mergeObjects(defaults, schema.default) as T;
    }
  } else if (DEFAULT_KEY in schema && !preferParentDefaults && !xxxOf && !schema[REF_KEY]) {
    // If the schema has a default value and parentDefaults does not have precedence
    // And if the schema does not have anyOf or oneOf (since we need to merge the defaults with the formData)
    // Then we should use it as the default.
    defaults = schema.default as unknown as T;
  } else if (REF_KEY in schema) {
    const refName = schema[REF_KEY];
    // Use referenced schema defaults for this node.
    if (!_recurseList.includes(refName!)) {
      updatedRecurseList = _recurseList.concat(refName!);
      schemaToCompute = findSchemaDefinition<S>(refName, rootSchema);
    }

    // If the referenced schema exists and parentDefaults is not set
    // Then set the defaults from the current schema for the referenced schema.
    // Only do this if rawFormData has no meaningful data - we don't want to override user's existing values.
    // Check for undefined OR empty object - rawFormData may be coerced to {} when not an object.
    if (schemaToCompute && !defaults && isEmptyFormData(rawFormData)) {
      defaults = schema.default as T | undefined;
    }

    // If shouldMergeDefaultsIntoFormData is true
    // And the schemaToCompute is set and the rawFormData is not an object
    // Then set the formData to the rawFormData
    if (shouldMergeDefaultsIntoFormData && schemaToCompute && !isObject(rawFormData)) {
      formData = rawFormData as T;
    }
  } else if (DEPENDENCIES_KEY in schema) {
    // Get the default if set from properties to ensure the dependencies conditions are resolved based on it
    // An array type's defaults are discarded below, so skip building every `minItems` entry. A whole-value select keeps
    // the call, since it can resolve to an object default inherited from its parent
    const schemaDefaults =
      getSchemaType<S>(schema) === 'array' && !isWholeValueSelect<S>(schema)
        ? undefined
        : getDefaultBasedOnSchemaType(context, schema, computeDefaultsProps, defaults);
    const objectDefaults: GenericObjectType = isObject(schemaDefaults) ? schemaDefaults : {};
    const defaultFormData: T = { ...objectDefaults, ...formData };
    const resolvedSchema = resolveDependencies<T, S, F>(context, schema, rootSchema, false, [], defaultFormData);
    [schemaToCompute] = resolvedSchema; // pick the first element from resolve dependencies
  } else if (isFixedItems(schema) && !preferParentDefaults) {
    // If the schema contains fixed items and parentDefaults does not have precedence
    // Then construct defaults from defaults of array items.
    defaults = (schema.items! as S[]).map((itemSchema: S, idx: number) =>
      computeDefaults<T, S, F>(context, itemSchema, {
        rootSchema,
        includeUndefinedValues,
        _recurseList,
        parentDefaults: Array.isArray(parentDefaults) ? parentDefaults[idx] : undefined,
        rawFormData: formData,
        required,
        shouldMergeDefaultsIntoFormData,
        initialDefaultsGenerated,
        uiSchema: getStaticItemsUiSchema<T, S, F>(uiSchema, idx),
        uiSchemaDefinitions,
      }),
    ) as T[];
  } else if (xxxOf) {
    const { key, options } = xxxOf;
    const { [key]: _options, ...remaining } = schema;
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    const { type = 'null' } = remaining;
    // An object or array select holds one of its constants as a whole, the way a primitive select does. The options are
    // checked as well, since a non-empty `enum` makes the schema a select whatever they are, and only a constant can be
    // taken whole
    isWholeValue = isWholeValueSelect<S>(schema);
    const picksWholeOption = isWholeValue && isConstantOptionList<S>(options, true);
    // Checked on the schema rather than on the keyword read, so a `oneOf` beside the `anyOf` that is read still skips,
    // unless it is empty, which counts as no option list here as it does for the keyword read
    const skipsOneOfConstants =
      !!schema[ONE_OF_KEY]?.length &&
      !Array.isArray(type) &&
      (PRIMITIVE_TYPES.includes(type) || picksWholeOption) &&
      defaultFormStateBehavior?.constAsDefaults === 'skipOneOf';
    if (skipsOneOfConstants) {
      // If we are in a oneOf of a primitive type, or of whole object or array values, then we want to pass
      // constAsDefaults as 'never' for the recursion
      contextToCompute = {
        ...context,
        defaultFormStateBehavior: { ...defaultFormStateBehavior, constAsDefaults: 'never' },
      };
    }
    // A whole value is picked as it stands, so an inherited default naming one of the options is the one to pick
    const inheritedDefault = preferParentDefaults ? defaults : (schema.default ?? defaults);
    const valueToMatch = rawFormData ?? ((picksWholeOption ? inheritedDefault : schema.default) as T);
    // A constant option equal to the value is the one it picked, whatever the validator makes of the others
    const equalOptionIndex = picksWholeOption
      ? options.findIndex((option) => deepEquals(toConstant<S>(option), valueToMatch))
      : -1;
    const optionIndex =
      equalOptionIndex !== -1
        ? equalOptionIndex
        : getClosestMatchingOption<T, S, F>(context, rootSchema, valueToMatch, options, 0, discriminator);
    // Resolved here rather than by recursing into the option as a primitive select is, since the option's constant is
    // taken as a whole: filling in its properties or items would reduce it to an empty value no option allows. The
    // constant wins over an inherited default, as it does for a primitive `const`, unless constants are never defaults.
    // The `ui:initialValue`/`ui:emptyValue` below still apply, and any form data is kept as it is by
    // `getDefaultBasedOnSchemaType()`
    if (picksWholeOption) {
      if (rawFormData === undefined && contextToCompute.defaultFormStateBehavior?.constAsDefaults !== 'never') {
        defaults = toConstant<S>(options[optionIndex]) as T;
      }
    } else {
      schemaToCompute = mergeSchemas(remaining, options[optionIndex]) as S;
      branchUiSchema = getOptionUiSchema<T, S, F>(uiSchema, key, optionIndex);
    }
  } else if (shouldPopulateAllOfDefaults(schema, defaultFormStateBehavior) && getSchemaType<S>(schema) !== 'object') {
    // `allOf` on an object schema is already resolved by `getObjectDefaults()`. On any other schema
    // nothing resolves it, so the defaults of the subschemas are lost. This happens, for instance,
    // for a single-element `allOf` wrapping a `$ref` to a string, which is equivalent to using the
    // `$ref` directly. Merge the `allOf` here so those defaults are picked up as well.
    schemaToCompute = retrieveSchema<T, S, F>(context, schema, rootSchema, rawFormData);
  }

  if (schemaToCompute) {
    return computeDefaults<T, S, F>(contextToCompute, schemaToCompute, {
      rootSchema,
      includeUndefinedValues,
      _recurseList: updatedRecurseList,
      parentDefaults: defaults as T | undefined,
      rawFormData: rawFormData ?? formData,
      required,
      shouldMergeDefaultsIntoFormData,
      initialDefaultsGenerated,
      uiSchema: branchUiSchema,
      uiSchemaDefinitions,
    });
  }

  // No defaults defined for this node, fallback to generic typed ones.
  if (defaults === undefined) {
    defaults = schema.default as unknown as T;
  }

  // `ui:initialValue` takes priority over `schema.default`; `ui:emptyValue` is only used as a last resort, when
  // nothing else (formData, schema default or `ui:initialValue`) has produced a value for the field.
  if (uiSchema) {
    const { initialValue, emptyValue } = getUiOptions<T, S, F>(uiSchema);
    if (initialValue !== undefined && !initialDefaultsGenerated) {
      defaults = initialValue as T;
    } else if (defaults === undefined && emptyValue !== undefined) {
      defaults = emptyValue as T;
    }
  }

  const defaultBasedOnSchemaType = getDefaultBasedOnSchemaType(
    context,
    schema,
    computeDefaultsProps,
    defaults,
    isWholeValue,
  );

  let defaultsWithFormData = defaultBasedOnSchemaType ?? defaults;
  // if shouldMergeDefaultsIntoFormData is true, then merge the defaults into the formData.
  if (shouldMergeDefaultsIntoFormData) {
    const { arrayMinItems = {} } = defaultFormStateBehavior ?? {};
    const { mergeExtraDefaults } = arrayMinItems;

    const matchingFormData = ensureFormDataMatchingSchema(context, schema, rootSchema, rawFormData);
    if (!isObject(rawFormData) || ALL_OF_KEY in schema) {
      // If the formData is not an object which means it's a primitive field, then we need to merge the defaults into the formData.
      // Or if the schema has allOf, we need to merge the defaults into the formData because we don't compute the defaults for allOf.
      defaultsWithFormData = mergeDefaultsWithFormData<T>(
        defaultsWithFormData as T,
        matchingFormData as T,
        mergeExtraDefaults,
        true,
      ) as T;
    }
  }

  return defaultsWithFormData;
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
  const isSelectField = !isConstant<S>(schemaToMatch) && isSelect<T, S, F>(context, schemaToMatch, rootSchema);
  let validFormData: T | T[] | undefined = formData;
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
    validFormData = schemaToMatch.const as T;
  } else if (isObject(validFormData) && isObject(schemaToMatch.properties)) {
    validFormData = Object.keys(schemaToMatch.properties).reduce(
      (acc: GenericObjectType, key: string) => {
        const propertySchema = getPropertySchema<S>(schemaToMatch, key);
        if (key in acc && (shouldRetrieveAllOf || (isObject(propertySchema) && ALL_OF_KEY in propertySchema))) {
          acc[key] = ensureFormDataMatchingSchema<T, S, F>(context, propertySchema, rootSchema, acc[key]);
        }
        return acc;
      },
      { ...(validFormData as GenericObjectType) },
    ) as T;
  }

  return validFormData;
}

/** Computes the default value for objects.
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
  {
    rawFormData,
    rootSchema = {} as S,
    includeUndefinedValues = false,
    _recurseList = [],
    required,
    shouldMergeDefaultsIntoFormData,
    initialDefaultsGenerated,
    uiSchema,
    uiSchemaDefinitions,
  }: ComputeDefaultsProps<T, S, F> = {},
  defaults?: T | T[],
): T {
  const { defaultFormStateBehavior } = context;
  {
    const formData: T = (isObject(rawFormData) ? rawFormData : {}) as T;
    const schema: S = rawSchema;
    // Retrieve the schema:
    // - If schema contains `allOf` AND `defaultFormStateBehavior.allOf` is set to `populateDefaults`
    // - OR if schema contains an 'if' AND `emptyObjectFields` is not set to `skipEmptyDefaults`
    // This ensures we compute defaults correctly for schemas with these keywords.
    const shouldRetrieveSchema =
      shouldPopulateAllOfDefaults(schema, defaultFormStateBehavior) ||
      (defaultFormStateBehavior?.emptyObjectFields !== 'skipEmptyDefaults' && IF_KEY in schema);
    const retrievedSchema = shouldRetrieveSchema
      ? retrieveSchema<T, S, F>(context, schema, rootSchema, formData)
      : schema;
    const parentConst = retrievedSchema[CONST_KEY];
    const objectDefaults = Object.keys(retrievedSchema.properties ?? {}).reduce(
      (acc: GenericObjectType, key: string) => {
        const propertySchema = getPropertySchema<S>(retrievedSchema, key);
        // Check if the parent schema has a const property defined AND we are supporting const as defaults, then we
        // should always return the computedDefault since it's coming from the const.
        const hasParentConst = isObject(parentConst) && (parentConst as JSONSchema7Object)[key] !== undefined;
        const hasConst =
          ((isObject(propertySchema) && CONST_KEY in propertySchema) || hasParentConst) &&
          defaultFormStateBehavior?.constAsDefaults !== 'never' &&
          !constIsAjvDataReference(propertySchema);
        // A property already materialized by `retrieveSchema()`'s `stubExistingAdditionalProperties()` from
        // `additionalProperties`/`patternProperties` (flagged here, same as ObjectField's own rendering) shares
        // `uiSchema.additionalProperties` with every other such property, rather than a dynamically-named entry.
        const addedByAdditionalProperty = Boolean((propertySchema as RJSFMarkedSchema)?.[ADDITIONAL_PROPERTY_FLAG]);
        // Compute the defaults for this node, with the parent defaults we might
        // have from a previous run: defaults[key].
        const computedDefault = computeDefaults<T, S, F>(context, propertySchema, {
          rootSchema,
          _recurseList,
          includeUndefinedValues: includeUndefinedValues === true,
          parentDefaults: getByPath<T>(defaults, key),
          rawFormData: getByPath<T>(formData, key),
          required: retrievedSchema.required?.includes(key),
          shouldMergeDefaultsIntoFormData,
          initialDefaultsGenerated,
          uiSchema: getByPath<UiSchema<T, S, F> | undefined>(
            uiSchema,
            addedByAdditionalProperty ? ADDITIONAL_PROPERTIES_KEY : key,
          ),
          uiSchemaDefinitions,
        });

        maybeAddDefaultToObject<T>(
          acc,
          key,
          computedDefault,
          includeUndefinedValues,
          required,
          retrievedSchema.required,
          defaultFormStateBehavior?.emptyObjectFields,
          hasConst,
          propertySchema?.type === 'null',
        );

        return acc;
      },
      {},
    ) as T;
    if (retrievedSchema.additionalProperties && !initialDefaultsGenerated) {
      // as per spec additionalProperties may be either schema or boolean
      const additionalPropertiesSchema = isObject(retrievedSchema.additionalProperties)
        ? retrievedSchema.additionalProperties
        : {};

      const keys = new Set<string>();
      const formDataRequired: string[] = [];
      Object.keys(formData as GenericObjectType)
        .filter((key) => !retrievedSchema.properties || !retrievedSchema.properties[key])
        .forEach((key) => {
          keys.add(key);
          formDataRequired.push(key);
        });
      // Only seed keys from schema defaults when formData has no additionalProperties of its own.
      // If the user already has data (e.g. after a key rename), injecting default keys would
      // re-add stale entries that no longer exist in formData.
      if (isObject(defaults) && formDataRequired.length === 0) {
        Object.keys(defaults as GenericObjectType)
          .filter((key) => !retrievedSchema.properties || !retrievedSchema.properties[key])
          .forEach((key) => keys.add(key));
      }
      keys.forEach((key) => {
        const computedDefault = computeDefaults(context, additionalPropertiesSchema as S, {
          rootSchema,
          _recurseList,
          includeUndefinedValues: includeUndefinedValues === true,
          parentDefaults: getByPath<T>(defaults, key),
          rawFormData: getByPath<T>(formData, key),
          required: retrievedSchema.required?.includes(key),
          shouldMergeDefaultsIntoFormData,
          initialDefaultsGenerated,
          // Matches ObjectField's convention for properties added by `additionalProperties`: they all share
          // `uiSchema.additionalProperties` rather than each having its own dynamically-named entry in `uiSchema`.
          uiSchema: uiSchema?.additionalProperties as UiSchema<T, S, F> | undefined,
          uiSchemaDefinitions,
        });
        maybeAddDefaultToObject<T>(
          objectDefaults as GenericObjectType,
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
    return computeDefaultBasedOnSchemaTypeAndDefaults<T, S>(rawSchema, objectDefaults);
  }
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
  if (isFixedItems(schema) && idx >= (schema.items as S[]).length) {
    return uiSchema?.additionalItems as UiSchema<T, S, F> | undefined;
  }
  return getStaticItemsUiSchema<T, S, F>(uiSchema, idx);
}

/** Computes the default value for arrays.
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
  {
    rawFormData,
    rootSchema = {} as S,
    _recurseList = [],
    required,
    requiredAsRoot = false,
    shouldMergeDefaultsIntoFormData,
    initialDefaultsGenerated,
    uiSchema,
    uiSchemaDefinitions,
  }: ComputeDefaultsProps<T, S, F> = {},
  initialDefaults?: T[],
): T[] | undefined {
  const { defaultFormStateBehavior } = context;
  let defaults = initialDefaults;
  const schema: S = rawSchema;

  const arrayMinItemsStateBehavior = defaultFormStateBehavior?.arrayMinItems ?? {};
  const { populate: arrayMinItemsPopulate, mergeExtraDefaults: arrayMergeExtraDefaults } = arrayMinItemsStateBehavior;

  const neverPopulate = arrayMinItemsPopulate === 'never';
  const ignoreMinItemsFlagSet = arrayMinItemsPopulate === 'requiredOnly';
  const isPopulateAll = arrayMinItemsPopulate === 'all' || (!neverPopulate && !ignoreMinItemsFlagSet);
  const computeSkipPopulate = arrayMinItemsStateBehavior?.computeSkipPopulate ?? (() => false);
  const isSkipEmptyDefaults = defaultFormStateBehavior?.emptyObjectFields === 'skipEmptyDefaults';

  const emptyDefault: T[] | undefined = isSkipEmptyDefaults ? undefined : [];

  // Inject defaults into existing array defaults
  if (Array.isArray(defaults)) {
    defaults = defaults.map((item, idx) => {
      const schemaItem: S = getInnerSchemaForArrayItem<S>(schema, AdditionalItemsHandling.Fallback, idx);
      const itemFormData = Array.isArray(rawFormData) ? rawFormData[idx] : undefined;
      return computeDefaults<T, S, F>(context, schemaItem, {
        rootSchema,
        _recurseList,
        parentDefaults: item,
        rawFormData: itemFormData,
        required,
        shouldMergeDefaultsIntoFormData,
        initialDefaultsGenerated,
        uiSchema: getItemUiSchemaForIndex<T, S, F>(schema, uiSchema, idx),
        uiSchemaDefinitions,
      });
    }) as T[];
  }

  // Deeply inject defaults into already existing form data
  if (Array.isArray(rawFormData)) {
    const schemaItem: S = getInnerSchemaForArrayItem<S>(schema);
    if (neverPopulate) {
      defaults = rawFormData as typeof defaults;
    } else {
      const itemDefaults = rawFormData.map((item: T, idx: number) =>
        computeDefaults<T, S, F>(context, schemaItem, {
          rootSchema,
          _recurseList,
          rawFormData: item,
          parentDefaults: getByPath<T>(defaults, idx),
          required,
          shouldMergeDefaultsIntoFormData,
          initialDefaultsGenerated,
          uiSchema: getItemUiSchemaForIndex<T, S, F>(schema, uiSchema, idx),
          uiSchemaDefinitions,
        }),
      ) as T[];

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

  let arrayDefault: T[] | undefined;
  if (
    !schema.minItems ||
    isMultiSelect<T, S, F>(context, schema, rootSchema) ||
    computeSkipPopulate<S, F>(context, schema, rootSchema) ||
    schema.minItems <= defaultsLength
  ) {
    // we don't want undefined defaults unless it is both not required or not required as root
    arrayDefault = defaults || (!required && !requiredAsRoot) ? defaults : emptyDefault;
  } else {
    const defaultEntries: T[] = Array.isArray(defaults) ? defaults : [];
    const fillerSchema: S = getInnerSchemaForArrayItem<S>(schema, AdditionalItemsHandling.Invert);
    const fillerDefault = fillerSchema.default;

    // Calculate filler entries for remaining items (minItems - existing raw data/defaults), each resolving the
    // uiSchema for its own final position (`defaultsLength + i`) the same way `ArrayField` resolves it once rendered,
    // rather than sharing a single uiSchema across every filler row regardless of position.
    const fillerEntries: T[] = Array.from({ length: schema.minItems - defaultsLength }, (_unused, i) =>
      computeDefaults<unknown, S, F>(context, fillerSchema, {
        parentDefaults: fillerDefault,
        rootSchema,
        _recurseList,
        required,
        shouldMergeDefaultsIntoFormData,
        initialDefaultsGenerated,
        uiSchema: getItemUiSchemaForIndex<T, S, F>(schema, uiSchema, defaultsLength + i),
        uiSchemaDefinitions,
      }),
    ) as T[];
    // then fill up the rest with either the item default or empty, up to minItems
    arrayDefault = defaultEntries.concat(fillerEntries);
  }

  return computeDefaultBasedOnSchemaTypeAndDefaults<T[] | undefined, S>(rawSchema, arrayDefault);
}

/** Computes the default value based on the schema type.
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
  isWholeValue = isWholeValueSelect<S>(rawSchema),
): T | T[] | undefined {
  // A select over object or array constants picks one of them as a whole, so it has no contents of its own to fill in,
  // and an empty object or array would be a value none of its options allow. A value already picked is kept as it is,
  // since the form data is merged over the defaults key by key, which would blend it with the default constant
  if (isWholeValue) {
    // A `null` value is one the user picked, so only a missing one falls back to the default
    if (computeDefaultsProps.rawFormData === undefined) {
      return defaults;
    }
    return computeDefaultsProps.rawFormData;
  }
  // A `ui:widget` that `SchemaField` renders through another listed type's field takes that type's default, so a
  // required `['null', 'boolean', 'string']` shown as a `textarea` isn't seeded with a `false` the textarea can't show
  const { uiSchema } = computeDefaultsProps;
  const widget = uiSchema ? getUiOptions<T, S, F>(uiSchema).widget : undefined;
  switch (getFieldTypeForWidget<S>(rawSchema, widget)) {
    // We need to recurse for object schema inner default values.
    case 'object': {
      return getObjectDefaults(context, rawSchema, computeDefaultsProps, defaults);
    }
    case 'array': {
      return getArrayDefaults(context, rawSchema, computeDefaultsProps, defaults as T[]);
    }
    case 'boolean': {
      // A required boolean with no explicit default gets false — it must be
      // present in the submitted data, and false is the natural zero-value.
      // `requiredBooleanDefault: 'skip'` opts out for forms that treat an
      // unanswered boolean as a distinct state and rely on `required` to flag it.
      const requiredBooleanDefault = context.defaultFormStateBehavior?.requiredBooleanDefault;
      if (requiredBooleanDefault !== 'skip' && computeDefaultsProps.required && defaults === undefined) {
        return false as unknown as T;
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

/** Returns the superset of `formData` that includes the given set updated to include any missing fields that have
 * computed to have defaults provided in the `schema`.
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
) {
  if (!isObject(theSchema)) {
    throw new Error(`Invalid schema: ${String(theSchema)}`);
  }
  // Empty formData needs the defaults that computeDefaults will generate to resolve dependencies.
  const emptyFormData = isEmptyFormData(formData);
  const [schema] = retrieveSchemaInternal<T, S, F>(
    context,
    theSchema,
    rootSchema ?? ({} as S),
    formData,
    undefined,
    undefined,
    undefined,
    emptyFormData,
  );

  // Get the computed defaults with 'shouldMergeDefaultsIntoFormData' set to true to merge defaults into formData.
  // This is done when for example the value from formData does not exist in the schema 'enum' property, in such
  // cases we take the value from the defaults because the value from the formData is not valid.
  const defaults = computeDefaults<T, S, F>(context, schema, {
    // Empty data can leave dependency references unresolved, including inside oneOf/anyOf.
    rootSchema: rootSchema ?? (emptyFormData ? theSchema : undefined),
    includeUndefinedValues,
    rawFormData: formData,
    shouldMergeDefaultsIntoFormData: true,
    initialDefaultsGenerated,
    requiredAsRoot: true,
    uiSchema,
    uiSchemaDefinitions,
  });

  const objectDefaults: GenericObjectType | undefined = isObject(defaults) ? defaults : undefined;
  // Array form data takes the merge path below, which knows how to combine it with the defaults
  if (schema.type !== 'object' && isObject(schema.default) && objectDefaults && !Array.isArray(formData)) {
    return {
      ...objectDefaults,
      ...(isObject(formData) ? formData : undefined),
    } as T;
  }

  // If the formData is an object or an array, add additional properties from formData and override formData with
  // defaults since the defaults are already merged with formData.
  if (isObject(formData) || Array.isArray(formData)) {
    const { mergeDefaultsIntoFormData } = context.defaultFormStateBehavior ?? {};
    const defaultSupercedesUndefined = mergeDefaultsIntoFormData === 'useDefaultIfFormDataUndefined';
    const matchingFormData = ensureFormDataMatchingSchema<T, S, F>(context, schema, rootSchema ?? schema, formData);
    const result = mergeDefaultsWithFormData<T | T[]>(
      defaults,
      matchingFormData,
      true, // set to true to add any additional default array entries.
      defaultSupercedesUndefined,
      true, // set to true to override formData with defaults if they exist.
    );
    return result;
  }

  return defaults;
}
