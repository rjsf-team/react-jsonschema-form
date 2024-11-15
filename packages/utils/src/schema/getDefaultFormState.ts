import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
  ANY_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  DEPENDENCIES_KEY,
  PROPERTIES_KEY,
  ONE_OF_KEY,
  REF_KEY,
  ALL_OF_KEY,
} from '../constants';
import findSchemaDefinition from '../findSchemaDefinition';
import getClosestMatchingOption from './getClosestMatchingOption';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema';
import getSchemaType from '../getSchemaType';
import isObject from '../isObject';
import isFixedItems from '../isFixedItems';
import mergeDefaultsWithFormData from '../mergeDefaultsWithFormData';
import mergeObjects from '../mergeObjects';
import mergeSchemas from '../mergeSchemas';
import {
  Experimental_CustomMergeAllOf,
  Experimental_DefaultFormStateBehavior,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from '../types';
import isMultiSelect from './isMultiSelect';
import retrieveSchema, { resolveDependencies } from './retrieveSchema';
import { JSONSchema7Object } from 'json-schema';

const PRIMITIVE_TYPES = ['string', 'number', 'integer', 'boolean', 'null'];

/** Enum that indicates how `schema.additionalItems` should be handled by the `getInnerSchemaForArrayItem()` function.
 */
export enum AdditionalItemsHandling {
  Ignore,
  Invert,
  Fallback,
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
  idx = -1
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

/** Either add `computedDefault` at `key` into `obj` or not add it based on its value, the value of
 * `includeUndefinedValues`, the value of `emptyObjectFields` and if its parent field is required. Generally undefined
 * `computedDefault` values are added only when `includeUndefinedValues` is either true/"excludeObjectChildren". If `
 * includeUndefinedValues` is false and `emptyObjectFields` is not "skipDefaults", then non-undefined and non-empty-object
 * values will be added based on certain conditions.
 *
 * @param obj - The object into which the computed default may be added
 * @param key - The key into the object at which the computed default may be added
 * @param computedDefault - The computed default value that maybe should be added to the obj
 * @param includeUndefinedValues - Optional flag, if true, cause undefined values to be added as defaults.
 *          If "excludeObjectChildren", cause undefined values for this object and pass `includeUndefinedValues` as
 *          false when computing defaults for any nested object properties. If "allowEmptyObject", prevents undefined
 *          values in this object while allow the object itself to be empty and passing `includeUndefinedValues` as
 *          false when computing defaults for any nested object properties.
 * @param isParentRequired - The optional boolean that indicates whether the parent field is required
 * @param requiredFields - The list of fields that are required
 * @param experimental_defaultFormStateBehavior - Optional configuration object, if provided, allows users to override
 *        default form state behavior
 * @param isConst - Optional flag, if true, indicates that the schema has a const property defined, thus we should always return the computedDefault since it's coming from the const.
 */
function maybeAddDefaultToObject<T = any>(
  obj: GenericObjectType,
  key: string,
  computedDefault: T | T[] | undefined,
  includeUndefinedValues: boolean | 'excludeObjectChildren',
  isParentRequired?: boolean,
  requiredFields: string[] = [],
  experimental_defaultFormStateBehavior: Experimental_DefaultFormStateBehavior = {},
  isConst = false
) {
  const { emptyObjectFields = 'populateAllDefaults' } = experimental_defaultFormStateBehavior;
  if (includeUndefinedValues || isConst) {
    // If includeUndefinedValues
    // Or if the schema has a const property defined, then we should always return the computedDefault since it's coming from the const.
    obj[key] = computedDefault;
  } else if (emptyObjectFields !== 'skipDefaults') {
    if (isObject(computedDefault)) {
      // If isParentRequired is undefined, then we are at the root level of the schema so defer to the requiredness of
      // the field key itself in the `requiredField` list
      const isSelfOrParentRequired = isParentRequired === undefined ? requiredFields.includes(key) : isParentRequired;

      // If emptyObjectFields 'skipEmptyDefaults' store computedDefault if it's a non-empty object(e.g. not {})
      if (emptyObjectFields === 'skipEmptyDefaults') {
        if (!isEmpty(computedDefault)) {
          obj[key] = computedDefault;
        }
      }
      // Else store computedDefault if it's a non-empty object(e.g. not {}) and satisfies certain conditions
      // Condition 1: If computedDefault is not empty or if the key is a required field
      // Condition 2: If the parent object is required or emptyObjectFields is not 'populateRequiredDefaults'
      else if (
        (!isEmpty(computedDefault) || requiredFields.includes(key)) &&
        (isSelfOrParentRequired || emptyObjectFields !== 'populateRequiredDefaults')
      ) {
        obj[key] = computedDefault;
      }
    } else if (
      // Store computedDefault if it's a defined primitive (e.g., true) and satisfies certain conditions
      // Condition 1: computedDefault is not undefined
      // Condition 2: If emptyObjectFields is 'populateAllDefaults' or 'skipEmptyDefaults) or if the key is a required field
      computedDefault !== undefined &&
      (emptyObjectFields === 'populateAllDefaults' ||
        emptyObjectFields === 'skipEmptyDefaults' ||
        requiredFields.includes(key))
    ) {
      obj[key] = computedDefault;
    }
  }
}

interface ComputeDefaultsProps<T = any, S extends StrictRJSFSchema = RJSFSchema> {
  /** Any defaults provided by the parent field in the schema */
  parentDefaults?: T;
  /** The options root schema, used to primarily to look up `$ref`s */
  rootSchema?: S;
  /** The current formData, if any, onto which to provide any missing defaults */
  rawFormData?: T;
  /** Optional flag, if true, cause undefined values to be added as defaults.
   *          If "excludeObjectChildren", cause undefined values for this object and pass `includeUndefinedValues` as
   *          false when computing defaults for any nested object properties.
   */
  includeUndefinedValues?: boolean | 'excludeObjectChildren';
  /** The list of ref names currently being recursed, used to prevent infinite recursion */
  _recurseList?: string[];
  /** Optional configuration object, if provided, allows users to override default form state behavior */
  experimental_defaultFormStateBehavior?: Experimental_DefaultFormStateBehavior;
  /** Optional function that allows for custom merging of `allOf` schemas */
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>;
  /** Optional flag, if true, indicates this schema was required in the parent schema. */
  required?: boolean;
}

/** Computes the defaults for the current `schema` given the `rawFormData` and `parentDefaults` if any. This drills into
 * each level of the schema, recursively, to fill out every level of defaults provided by the schema.
 *
 * @param validator - an implementation of the `ValidatorType` interface that will be used when necessary
 * @param rawSchema - The schema for which the default state is desired
 * @param {ComputeDefaultsProps} computeDefaultsProps - Optional props for this function
 * @returns - The resulting `formData` with all the defaults provided
 */
export function computeDefaults<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  rawSchema: S,
  computeDefaultsProps: ComputeDefaultsProps<T, S> = {}
): T | T[] | undefined {
  const {
    parentDefaults,
    rawFormData,
    rootSchema = {} as S,
    includeUndefinedValues = false,
    _recurseList = [],
    experimental_defaultFormStateBehavior = undefined,
    experimental_customMergeAllOf = undefined,
    required,
  } = computeDefaultsProps;
  const formData: T = (isObject(rawFormData) ? rawFormData : {}) as T;
  const schema: S = isObject(rawSchema) ? rawSchema : ({} as S);
  // Compute the defaults recursively: give highest priority to deepest nodes.
  let defaults: T | T[] | undefined = parentDefaults;
  // If we get a new schema, then we need to recompute defaults again for the new schema found.
  let schemaToCompute: S | null = null;
  let experimental_dfsb_to_compute = experimental_defaultFormStateBehavior;
  let updatedRecurseList = _recurseList;

  if (schema[CONST_KEY] && experimental_defaultFormStateBehavior?.constAsDefaults !== 'never') {
    defaults = schema.const as unknown as T;
  } else if (isObject(defaults) && isObject(schema.default)) {
    // For object defaults, only override parent defaults that are defined in
    // schema.default.
    defaults = mergeObjects(defaults!, schema.default as GenericObjectType) as T;
  } else if (DEFAULT_KEY in schema) {
    defaults = schema.default as unknown as T;
  } else if (REF_KEY in schema) {
    const refName = schema[REF_KEY];
    // Use referenced schema defaults for this node.
    if (!_recurseList.includes(refName!)) {
      updatedRecurseList = _recurseList.concat(refName!);
      schemaToCompute = findSchemaDefinition<S>(refName, rootSchema);
    }
  } else if (DEPENDENCIES_KEY in schema) {
    // Get the default if set from properties to ensure the dependencies conditions are resolved based on it
    const defaultFormData: T = {
      ...getDefaultBasedOnSchemaType(validator, schema, computeDefaultsProps, defaults),
      ...formData,
    };
    const resolvedSchema = resolveDependencies<T, S, F>(
      validator,
      schema,
      rootSchema,
      false,
      [],
      defaultFormData,
      experimental_customMergeAllOf
    );
    schemaToCompute = resolvedSchema[0]; // pick the first element from resolve dependencies
  } else if (isFixedItems(schema)) {
    defaults = (schema.items! as S[]).map((itemSchema: S, idx: number) =>
      computeDefaults<T, S>(validator, itemSchema, {
        rootSchema,
        includeUndefinedValues,
        _recurseList,
        experimental_defaultFormStateBehavior,
        experimental_customMergeAllOf,
        parentDefaults: Array.isArray(parentDefaults) ? parentDefaults[idx] : undefined,
        rawFormData: formData as T,
        required,
      })
    ) as T[];
  } else if (ONE_OF_KEY in schema) {
    const { oneOf, ...remaining } = schema;
    if (oneOf!.length === 0) {
      return undefined;
    }
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    const { type = 'null' } = remaining;
    if (
      !Array.isArray(type) &&
      PRIMITIVE_TYPES.includes(type) &&
      experimental_dfsb_to_compute?.constAsDefaults === 'skipOneOf'
    ) {
      // If we are in a oneOf of a primitive type, then we want to pass constAsDefaults as 'never' for the recursion
      experimental_dfsb_to_compute = { ...experimental_dfsb_to_compute, constAsDefaults: 'never' };
    }
    schemaToCompute = oneOf![
      getClosestMatchingOption<T, S, F>(
        validator,
        rootSchema,
        isEmpty(formData) ? undefined : formData,
        oneOf as S[],
        0,
        discriminator,
        experimental_customMergeAllOf
      )
    ] as S;
    schemaToCompute = mergeSchemas(remaining, schemaToCompute) as S;
  } else if (ANY_OF_KEY in schema) {
    const { anyOf, ...remaining } = schema;
    if (anyOf!.length === 0) {
      return undefined;
    }
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    schemaToCompute = anyOf![
      getClosestMatchingOption<T, S, F>(
        validator,
        rootSchema,
        isEmpty(formData) ? undefined : formData,
        anyOf as S[],
        0,
        discriminator,
        experimental_customMergeAllOf
      )
    ] as S;
    schemaToCompute = mergeSchemas(remaining, schemaToCompute) as S;
  }

  if (schemaToCompute) {
    return computeDefaults<T, S, F>(validator, schemaToCompute, {
      rootSchema,
      includeUndefinedValues,
      _recurseList: updatedRecurseList,
      experimental_defaultFormStateBehavior: experimental_dfsb_to_compute,
      experimental_customMergeAllOf,
      parentDefaults: defaults as T | undefined,
      rawFormData: formData as T,
      required,
    });
  }

  // No defaults defined for this node, fallback to generic typed ones.
  if (defaults === undefined) {
    defaults = schema.default as unknown as T;
  }

  const defaultBasedOnSchemaType = getDefaultBasedOnSchemaType(validator, schema, computeDefaultsProps, defaults);

  return defaultBasedOnSchemaType ?? defaults;
}

/** Computes the default value for objects.
 *
 * @param validator - an implementation of the `ValidatorType` interface that will be used when necessary
 * @param rawSchema - The schema for which the default state is desired
 * @param {ComputeDefaultsProps} computeDefaultsProps - Optional props for this function
 * @param defaults - Optional props for this function
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
export function getObjectDefaults<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  rawSchema: S,
  {
    rawFormData,
    rootSchema = {} as S,
    includeUndefinedValues = false,
    _recurseList = [],
    experimental_defaultFormStateBehavior = undefined,
    experimental_customMergeAllOf = undefined,
    required,
  }: ComputeDefaultsProps<T, S> = {},
  defaults?: T | T[] | undefined
): T {
  {
    const formData: T = (isObject(rawFormData) ? rawFormData : {}) as T;
    const schema: S = rawSchema;
    // This is a custom addition that fixes this issue:
    // https://github.com/rjsf-team/react-jsonschema-form/issues/3832
    const retrievedSchema =
      experimental_defaultFormStateBehavior?.allOf === 'populateDefaults' && ALL_OF_KEY in schema
        ? retrieveSchema<T, S, F>(validator, schema, rootSchema, formData, experimental_customMergeAllOf)
        : schema;
    const parentConst = retrievedSchema[CONST_KEY];
    const objectDefaults = Object.keys(retrievedSchema.properties || {}).reduce(
      (acc: GenericObjectType, key: string) => {
        const propertySchema = get(retrievedSchema, [PROPERTIES_KEY, key]);
        // Check if the parent schema has a const property defined AND we are supporting const as defaults, then we
        // should always return the computedDefault since it's coming from the const.
        const hasParentConst = isObject(parentConst) && (parentConst as JSONSchema7Object)[key] !== undefined;
        const hasConst =
          ((isObject(propertySchema) && CONST_KEY in propertySchema) || hasParentConst) &&
          experimental_defaultFormStateBehavior?.constAsDefaults !== 'never';
        // Compute the defaults for this node, with the parent defaults we might
        // have from a previous run: defaults[key].
        const computedDefault = computeDefaults<T, S, F>(validator, propertySchema, {
          rootSchema,
          _recurseList,
          experimental_defaultFormStateBehavior,
          experimental_customMergeAllOf,
          includeUndefinedValues: includeUndefinedValues === true,
          parentDefaults: get(defaults, [key]),
          rawFormData: get(formData, [key]),
          required: retrievedSchema.required?.includes(key),
        });
        maybeAddDefaultToObject<T>(
          acc,
          key,
          computedDefault,
          includeUndefinedValues,
          required,
          retrievedSchema.required,
          experimental_defaultFormStateBehavior,
          hasConst
        );
        return acc;
      },
      {}
    ) as T;
    if (retrievedSchema.additionalProperties) {
      // as per spec additionalProperties may be either schema or boolean
      const additionalPropertiesSchema = isObject(retrievedSchema.additionalProperties)
        ? retrievedSchema.additionalProperties
        : {};

      const keys = new Set<string>();
      if (isObject(defaults)) {
        Object.keys(defaults as GenericObjectType)
          .filter((key) => !retrievedSchema.properties || !retrievedSchema.properties[key])
          .forEach((key) => keys.add(key));
      }
      const formDataRequired: string[] = [];
      Object.keys(formData as GenericObjectType)
        .filter((key) => !retrievedSchema.properties || !retrievedSchema.properties[key])
        .forEach((key) => {
          keys.add(key);
          formDataRequired.push(key);
        });
      keys.forEach((key) => {
        const computedDefault = computeDefaults(validator, additionalPropertiesSchema as S, {
          rootSchema,
          _recurseList,
          experimental_defaultFormStateBehavior,
          experimental_customMergeAllOf,
          includeUndefinedValues: includeUndefinedValues === true,
          parentDefaults: get(defaults, [key]),
          rawFormData: get(formData, [key]),
          required: retrievedSchema.required?.includes(key),
        });
        // Since these are additional properties we don't need to add the `experimental_defaultFormStateBehavior` prop
        maybeAddDefaultToObject<T>(
          objectDefaults as GenericObjectType,
          key,
          computedDefault,
          includeUndefinedValues,
          required,
          formDataRequired
        );
      });
    }
    return objectDefaults;
  }
}

/** Computes the default value for arrays.
 *
 * @param validator - an implementation of the `ValidatorType` interface that will be used when necessary
 * @param rawSchema - The schema for which the default state is desired
 * @param {ComputeDefaultsProps} computeDefaultsProps - Optional props for this function
 * @param defaults - Optional props for this function
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
export function getArrayDefaults<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  rawSchema: S,
  {
    rawFormData,
    rootSchema = {} as S,
    _recurseList = [],
    experimental_defaultFormStateBehavior = undefined,
    experimental_customMergeAllOf = undefined,
    required,
  }: ComputeDefaultsProps<T, S> = {},
  defaults?: T | T[] | undefined
): T | T[] | undefined {
  const schema: S = rawSchema;

  const arrayMinItemsStateBehavior = experimental_defaultFormStateBehavior?.arrayMinItems ?? {};
  const { populate: arrayMinItemsPopulate, mergeExtraDefaults: arrayMergeExtraDefaults } = arrayMinItemsStateBehavior;

  const neverPopulate = arrayMinItemsPopulate === 'never';
  const ignoreMinItemsFlagSet = arrayMinItemsPopulate === 'requiredOnly';
  const isPopulateAll = arrayMinItemsPopulate === 'all' || (!neverPopulate && !ignoreMinItemsFlagSet);
  const computeSkipPopulate = arrayMinItemsStateBehavior?.computeSkipPopulate ?? (() => false);
  const isSkipEmptyDefaults = experimental_defaultFormStateBehavior?.emptyObjectFields === 'skipEmptyDefaults';

  const emptyDefault = isSkipEmptyDefaults ? undefined : [];

  // Inject defaults into existing array defaults
  if (Array.isArray(defaults)) {
    defaults = defaults.map((item, idx) => {
      const schemaItem: S = getInnerSchemaForArrayItem<S>(schema, AdditionalItemsHandling.Fallback, idx);
      return computeDefaults<T, S, F>(validator, schemaItem, {
        rootSchema,
        _recurseList,
        experimental_defaultFormStateBehavior,
        experimental_customMergeAllOf,
        parentDefaults: item,
        required,
      });
    }) as T[];
  }

  // Deeply inject defaults into already existing form data
  if (Array.isArray(rawFormData)) {
    const schemaItem: S = getInnerSchemaForArrayItem<S>(schema);
    if (neverPopulate) {
      defaults = rawFormData;
    } else {
      const itemDefaults = rawFormData.map((item: T, idx: number) => {
        return computeDefaults<T, S, F>(validator, schemaItem, {
          rootSchema,
          _recurseList,
          experimental_defaultFormStateBehavior,
          experimental_customMergeAllOf,
          rawFormData: item,
          parentDefaults: get(defaults, [idx]),
          required,
        });
      }) as T[];

      // If the populate 'requiredOnly' flag is set then we only merge and include extra defaults if they are required.
      // Or if populate 'all' is set we merge and include extra defaults.
      const mergeExtraDefaults = ((ignoreMinItemsFlagSet && required) || isPopulateAll) && arrayMergeExtraDefaults;
      defaults = mergeDefaultsWithFormData(defaults, itemDefaults, mergeExtraDefaults);
    }
  }

  // Check if the schema has a const property defined AND we are supporting const as defaults, then we should always
  // return the computedDefault since it's coming from the const.
  const hasConst =
    isObject(schema) && CONST_KEY in schema && experimental_defaultFormStateBehavior?.constAsDefaults !== 'never';
  if (hasConst === false) {
    if (neverPopulate) {
      return defaults ?? emptyDefault;
    }
    if (ignoreMinItemsFlagSet && !required) {
      // If no form data exists or defaults are set leave the field empty/non-existent, otherwise
      // return form data/defaults
      return defaults ? defaults : undefined;
    }
  }

  const defaultsLength = Array.isArray(defaults) ? defaults.length : 0;
  if (
    !schema.minItems ||
    isMultiSelect<T, S, F>(validator, schema, rootSchema, experimental_customMergeAllOf) ||
    computeSkipPopulate<T, S, F>(validator, schema, rootSchema) ||
    schema.minItems <= defaultsLength
  ) {
    return defaults ? defaults : emptyDefault;
  }

  const defaultEntries: T[] = (defaults || []) as T[];
  const fillerSchema: S = getInnerSchemaForArrayItem<S>(schema, AdditionalItemsHandling.Invert);
  const fillerDefault = fillerSchema.default;

  // Calculate filler entries for remaining items (minItems - existing raw data/defaults)
  const fillerEntries: T[] = new Array(schema.minItems - defaultsLength).fill(
    computeDefaults<any, S, F>(validator, fillerSchema, {
      parentDefaults: fillerDefault,
      rootSchema,
      _recurseList,
      experimental_defaultFormStateBehavior,
      experimental_customMergeAllOf,
      required,
    })
  ) as T[];
  // then fill up the rest with either the item default or empty, up to minItems
  return defaultEntries.concat(fillerEntries);
}

/** Computes the default value based on the schema type.
 *
 * @param validator - an implementation of the `ValidatorType` interface that will be used when necessary
 * @param rawSchema - The schema for which the default state is desired
 * @param {ComputeDefaultsProps} computeDefaultsProps - Optional props for this function
 * @param defaults - Optional props for this function
 * @returns - The default value based on the schema type if they are defined for object or array schemas.
 */
export function getDefaultBasedOnSchemaType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  validator: ValidatorType<T, S, F>,
  rawSchema: S,
  computeDefaultsProps: ComputeDefaultsProps<T, S> = {},
  defaults?: T | T[] | undefined
): T | T[] | void {
  switch (getSchemaType<S>(rawSchema)) {
    // We need to recurse for object schema inner default values.
    case 'object': {
      return getObjectDefaults(validator, rawSchema, computeDefaultsProps, defaults);
    }
    case 'array': {
      return getArrayDefaults(validator, rawSchema, computeDefaultsProps, defaults);
    }
  }
}

/** Returns the superset of `formData` that includes the given set updated to include any missing fields that have
 * computed to have defaults provided in the `schema`.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param theSchema - The schema for which the default state is desired
 * @param [formData] - The current formData, if any, onto which to provide any missing defaults
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [includeUndefinedValues=false] - Optional flag, if true, cause undefined values to be added as defaults.
 *          If "excludeObjectChildren", cause undefined values for this object and pass `includeUndefinedValues` as
 *          false when computing defaults for any nested object properties.
 * @param [experimental_defaultFormStateBehavior] Optional configuration object, if provided, allows users to override default form state behavior
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @returns - The resulting `formData` with all the defaults provided
 */
export default function getDefaultFormState<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(
  validator: ValidatorType<T, S, F>,
  theSchema: S,
  formData?: T,
  rootSchema?: S,
  includeUndefinedValues: boolean | 'excludeObjectChildren' = false,
  experimental_defaultFormStateBehavior?: Experimental_DefaultFormStateBehavior,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>
) {
  if (!isObject(theSchema)) {
    throw new Error('Invalid schema: ' + theSchema);
  }
  const schema = retrieveSchema<T, S, F>(validator, theSchema, rootSchema, formData, experimental_customMergeAllOf);
  const defaults = computeDefaults<T, S, F>(validator, schema, {
    rootSchema,
    includeUndefinedValues,
    experimental_defaultFormStateBehavior,
    experimental_customMergeAllOf,
    rawFormData: formData,
  });

  if (formData === undefined || formData === null || (typeof formData === 'number' && isNaN(formData))) {
    // No form data? Use schema defaults.
    return defaults;
  }
  const { mergeDefaultsIntoFormData, arrayMinItems = {} } = experimental_defaultFormStateBehavior || {};
  const { mergeExtraDefaults } = arrayMinItems;
  const defaultSupercedesUndefined = mergeDefaultsIntoFormData === 'useDefaultIfFormDataUndefined';
  if (isObject(formData)) {
    return mergeDefaultsWithFormData<T>(defaults as T, formData, mergeExtraDefaults, defaultSupercedesUndefined);
  }
  if (Array.isArray(formData)) {
    return mergeDefaultsWithFormData<T[]>(defaults as T[], formData, mergeExtraDefaults, defaultSupercedesUndefined);
  }
  return formData;
}
