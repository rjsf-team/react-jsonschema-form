import { ANY_OF_KEY, CONST_KEY, DEFAULT_KEY, ONE_OF_KEY, PROPERTIES_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getPropertySchema from '../getPropertySchema.ts';
import { getByPath, hasByPath } from '../pathUtils.ts';
import type {
  Experimental_CustomMergeAllOf,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from '../types.ts';
import { findClosestMatchingOption } from './getClosestMatchingOption.ts';
import retrieveSchema from './retrieveSchema.ts';

const NO_VALUE = Symbol('no Value');

function enumValuesForSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S): any[] | undefined {
  if (Array.isArray(schema.enum)) {
    return schema.enum;
  }

  const options = (schema.oneOf || schema.anyOf) as S[] | undefined;
  if (!Array.isArray(options)) {
    return undefined;
  }

  const values = options
    .map((option) => {
      if (CONST_KEY in option) {
        return option[CONST_KEY];
      }
      return Array.isArray(option.enum) && option.enum.length === 1 ? option.enum[0] : NO_VALUE;
    })
    .filter((value) => value !== NO_VALUE);

  return values.length > 0 ? values : undefined;
}

function replacementForInvalidEnumValue<S extends StrictRJSFSchema = RJSFSchema>(schema: S, formValue: any) {
  const enumValues = enumValuesForSchema(schema);
  if (!enumValues || enumValues.some((value) => deepEquals(value, formValue))) {
    return NO_VALUE;
  }

  const defaultValue = getByPath(schema, DEFAULT_KEY, NO_VALUE);
  if (defaultValue !== NO_VALUE && enumValues.some((value) => deepEquals(value, defaultValue))) {
    return defaultValue;
  }

  return enumValues.length === 1 ? enumValues[0] : undefined;
}

/** Returns the `anyOf` or `oneOf` options of the `schema`, looking for `anyOf` first as `SchemaField` does
 *
 * @param [schema] - The schema from which to get the options
 * @returns - The `anyOf` or `oneOf` options of the schema, or undefined when it has neither
 */
function xxxOfOptions<S extends StrictRJSFSchema = RJSFSchema>(schema?: S): S[] | undefined {
  const options = schema?.[ANY_OF_KEY] ?? schema?.[ONE_OF_KEY];
  return Array.isArray(options) ? (options as S[]) : undefined;
}

/** Sanitizes the `data` of a `oneOf`/`anyOf` schema that has nothing of its own to sanitize against, such as a root
 * `oneOf` that is not resolved to an option, by sanitizing it against the selected option. Only the level the
 * `oldData` is given for is sanitized: without it, as for a `oneOf`/`anyOf` nested in a property or in array items,
 * nothing tells what changed, so the `data` is returned as is.
 *
 * Which option is selected is `MultiSchemaField` state that the data does not carry, so it is worked out the way
 * `MultiSchemaField` picks it after a change. An option the `data` singles out, by a discriminator, as the only valid
 * option or by the best score, is selected whatever was selected before. Otherwise, as when two options accept the
 * `data` equally, `MultiSchemaField` keeps the option it had, which is only known here when the `oldData` singled it
 * out. When neither did, sanitizing against a guess could clear what the user entered, so the `data` is returned as is.
 *
 * The selected option resolved against the `data` is sanitized from the option the `oldData` singled out resolved
 * against the `oldData`, or from the selected option resolved against the `oldData` when the `oldData` singled out none.
 * So the fields of another option the `oldData` matched, and what a conditional declared only for the `oldData`, are
 * cleared. When the selected option has nothing to sanitize against, such as a free-form object or a scalar option, the
 * `data` is returned as is.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param rootSchema - The root JSON schema of the entire form
 * @param schema - The schema holding the `oneOf`/`anyOf`
 * @param options - The `oneOf`/`anyOf` options of the `schema`
 * @param data - The form data associated with the `schema`
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [oldData] - The form data the old schema was resolved against
 * @returns - The `data` sanitized against the selected option, or the `data` as is when there is no `oldData`, when the
 *      selected option is not known or when it has nothing to sanitize against
 */
function sanitizeDataForSelectedOption<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  rootSchema: S,
  schema: S,
  options: S[],
  data: any,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  oldData?: any,
): T {
  if (oldData === undefined) {
    return data;
  }
  const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
  const resolveOptions = (formData: any) =>
    options.map((option) =>
      retrieveSchema<T, S, F>(validator, option, rootSchema, formData, experimental_customMergeAllOf),
    );
  const singledOutOption = (formData: any, resolvedOptions: S[]) =>
    findClosestMatchingOption<T, S, F>(
      validator,
      rootSchema,
      formData,
      resolvedOptions,
      discriminator,
      experimental_customMergeAllOf,
    ).index;
  const resolvedOptions = resolveOptions(data);
  const resolvedOldOptions = resolveOptions(oldData);
  const oldIndex = singledOutOption(oldData, resolvedOldOptions);
  const index = singledOutOption(data, resolvedOptions) ?? oldIndex;
  if (index === undefined) {
    return data;
  }
  const newOption = resolvedOptions[index];
  const sanitized = sanitizeDataForNewSchema<T, S, F>(
    validator,
    rootSchema,
    newOption,
    resolvedOldOptions[oldIndex ?? index],
    data,
    experimental_customMergeAllOf,
    oldData,
  );
  // Only an object option with `properties` or an array option sanitizes the data, a free-form object or scalar option
  // has nothing to sanitize it against
  return sanitized === undefined && newOption.type !== 'array' ? data : sanitized;
}

/** Sanitize the `data` associated with the `oldSchema` so it is considered appropriate for the `newSchema`. If the new
 * schema does not contain any properties, then `undefined` is returned to clear all the form data, unless it has the
 * same `oneOf`/`anyOf` options as the old schema. Due to the nature of schemas, this sanitization happens recursively
 * for nested objects of data. Also, any properties in the old schema that are non-existent in the new schema are set to
 * `undefined`. The data sanitization process has the following flow:
 *
 * - If the new schema is an object that contains a `properties` object then:
 *   - Create a `removeOldSchemaData` object, setting each key in the `oldSchema.properties` having `data` to undefined
 *   - Create an empty `nestedData` object for use in the key filtering below:
 *   - Iterate over each key in the `newSchema.properties` as follows:
 *     - Get the `formValue` of the key from the `data`
 *     - Get the `oldKeySchema` and `newKeyedSchema` for the key, defaulting to `{}` when it doesn't exist
 *     - Retrieve the schema for any refs within each `oldKeySchema` and/or `newKeySchema`
 *     - Get the types of the old and new keyed schemas and if the old doesn't exist or the old & new are the same then:
 *       - If `removeOldSchemaData` has an entry for the key, delete it since the new schema has the same property
 *       - If type of the key in the new schema is `object`:
 *         - Store the value from the recursive `sanitizeDataForNewSchema` call in `nestedData[key]`
 *       - Otherwise, check for default or const values:
 *         - Get the old and new `default` values from the schema and check:
 *           - If the new `default` value does not match the form value:
 *             - If the key is new and its form value is undefined, or the old `default` matches the form value, then:
 *               - Replace `removeOldSchemaData[key]` with the new `default`
 *               - Otherwise, if the new schema is `readOnly` then replace `removeOldSchemaData[key]` with undefined
 *         - Get the old and new `const` values from the schema and check:
 *           - If the new `const` value does not match the form value:
 *           - If the old `const` value DOES match the form value, then:
 *             - Replace `removeOldSchemaData[key]` with the new `const`
 *             - Otherwise, replace `removeOldSchemaData[key]` with undefined
 *   - Once all keys have been processed, return an object built as follows:
 *     - `{ ...data, ...removeOldSchemaData, ...nestedData }`
 * - If the new and old schema types are array and the `data` is an array then:
 *   - If the type of the old and new schema `items` are a non-array objects:
 *     - Retrieve the schema for any refs within each `oldKeySchema.items` and/or `newKeySchema.items`
 *     - If the `type`s of both items are the same (or the old does not have a type):
 *       - If the type is "object", then:
 *         - For each element in the `data` recursively sanitize the data, stopping at `maxItems` if specified
 *       - Otherwise, just return the `data` removing any values after `maxItems` if it is set
 *   - If the type of the old and new schema `items` are booleans of the same value, return `data` as is
 * - If neither of the above produced data, the new schema is not an array, the `data` is not undefined and the new
 *   schema has the same `oneOf`/`anyOf` options as the old schema, which is the case for a root `oneOf` that is not
 *   resolved to an option, then:
 *   - If there is no `oldData`, return the `data` as is, since nothing tells what changed
 *   - Resolve each option against the `data` and the `oldData`, and find the option the `data` singles out by a
 *     discriminator, as the only valid option or by the best score. If there is none, use the option the `oldData`
 *     singled out instead, since `MultiSchemaField` keeps the option it had when the data does not single out one
 *   - If neither singled out an option, return the `data` as is, since which option is selected cannot be told from it
 *   - Otherwise, return the result of recursively sanitizing the `data` from the option the `oldData` singled out (or
 *     else the selected option) resolved against the `oldData` to the selected option resolved against the `data`,
 *     or the `data` as is when the selected option has nothing to sanitize against
 * - Otherwise return `undefined`
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param rootSchema - The root JSON schema of the entire form
 * @param [newSchema] - The new schema for which the data is being sanitized
 * @param [oldSchema] - The old schema from which the data originated
 * @param [data] - The form data associated with the schema, treated as an empty object when undefined, except that it is
 *      not sanitized against a `oneOf`/`anyOf` option
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [oldData] - The form data the `oldSchema` was resolved against. Only used to resolve a `oneOf`/`anyOf` option
 *      as it was for that data, and without it the data of such an option is returned as is
 * @returns - The new form data, with all the fields uniquely associated with the old schema set to `undefined`. Will
 *      return `undefined` if the new schema is not an object containing properties, unless it is not an array and has
 *      the same `oneOf`/`anyOf` options as the old schema
 */
export default function sanitizeDataForNewSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  validator: ValidatorType<T, S, F>,
  rootSchema: S,
  newSchema?: S,
  oldSchema?: S,
  data?: any,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  oldData?: any,
): T {
  // By default, we will clear the form data
  let newFormData;
  const newProperties = newSchema?.[PROPERTIES_KEY];
  // If the new schema is of type object and that object contains a list of properties
  if (newProperties) {
    // Create an object containing root-level keys in the old schema, setting each key to undefined to remove the data
    const removeOldSchemaData: GenericObjectType = {};
    const oldProperties = oldSchema?.[PROPERTIES_KEY];
    if (oldProperties) {
      Object.keys(oldProperties).forEach((key) => {
        if (hasByPath(data, key)) {
          removeOldSchemaData[key] = undefined;
        }
      });
    }
    const keys: string[] = Object.keys(newProperties);
    // Create a place to store nested data that will be a side-effect of the filter
    const nestedData: GenericObjectType = {};
    keys.forEach((key) => {
      const formValue = data?.[key];
      const isNewProperty = !hasByPath(oldSchema, [PROPERTIES_KEY, key]);
      const oldRawKeyedSchema = getPropertySchema<S>(oldSchema, key);
      const newRawKeyedSchema = getPropertySchema<S>(newSchema, key);
      // Resolve refs, dependencies, if/then/else and allOf so a dependency nested inside this key
      // (not just at the root schema) is taken into account when sanitizing its data (#5250)
      const oldKeyedSchema = retrieveSchema<T, S, F>(
        validator,
        oldRawKeyedSchema,
        rootSchema,
        formValue,
        experimental_customMergeAllOf,
      );
      // The old and new raw schema for a key are usually identical (most keys aren't touched by whatever changed),
      // so skip resolving (and re-running any oneOf/dependency validity checks) a second time in that common case.
      const newKeyedSchema = deepEquals(oldRawKeyedSchema, newRawKeyedSchema)
        ? oldKeyedSchema
        : retrieveSchema<T, S, F>(validator, newRawKeyedSchema, rootSchema, formValue, experimental_customMergeAllOf);
      // Now get types and see if they are the same
      const oldSchemaTypeForKey = oldKeyedSchema.type;
      const newSchemaTypeForKey = newKeyedSchema.type;
      // Check if the old option has the same key with the same type
      if (!oldSchemaTypeForKey || oldSchemaTypeForKey === newSchemaTypeForKey) {
        if (key in removeOldSchemaData) {
          // SIDE-EFFECT: remove the undefined value for a key that has the same type between the old and new schemas
          delete removeOldSchemaData[key];
        }
        // If it is an object, we'll recurse and store the resulting sanitized data for the key
        if (newSchemaTypeForKey === 'object' || (newSchemaTypeForKey === 'array' && Array.isArray(formValue))) {
          // SIDE-EFFECT: process the new schema type of object recursively to save iterations
          const itemData = sanitizeDataForNewSchema<T, S, F>(
            validator,
            rootSchema,
            newKeyedSchema,
            isNewProperty && newSchemaTypeForKey === 'array' ? newKeyedSchema : oldKeyedSchema,
            formValue,
            experimental_customMergeAllOf,
          );
          if (itemData !== undefined || newSchemaTypeForKey === 'array') {
            // only put undefined values for the array type and not the object type
            nestedData[key] = itemData;
          }
        } else {
          // Ok, the non-object types match, let's make sure that a default or a const of a different value is replaced
          // with the new default or const. This allows the case where two schemas differ that only by the default/const
          // value to be properly selected
          const newOptionDefault = getByPath(newKeyedSchema, DEFAULT_KEY, NO_VALUE);
          const oldOptionDefault = getByPath(oldKeyedSchema, DEFAULT_KEY, NO_VALUE);
          if (newOptionDefault !== NO_VALUE && newOptionDefault !== formValue) {
            if ((isNewProperty && formValue === undefined) || oldOptionDefault === formValue) {
              // Initialize a newly entered property or replace an old default with the new default.
              removeOldSchemaData[key] = newOptionDefault;
            } else if (newKeyedSchema.readOnly === true) {
              // If the new schema has the default set to read-only, treat it like a const and remove the value
              removeOldSchemaData[key] = undefined;
            }
          }

          const newOptionConst = getByPath(newKeyedSchema, CONST_KEY, NO_VALUE);
          const oldOptionConst = getByPath(oldKeyedSchema, CONST_KEY, NO_VALUE);
          if (newOptionConst !== NO_VALUE && newOptionConst !== formValue) {
            // Since this is a const, if the old value matches, replace the value with the new const otherwise clear it
            removeOldSchemaData[key] = oldOptionConst === formValue ? newOptionConst : undefined;
          }

          if (hasByPath(data, key)) {
            const enumReplacement = replacementForInvalidEnumValue(newKeyedSchema, formValue);
            if (enumReplacement !== NO_VALUE) {
              removeOldSchemaData[key] = enumReplacement;
            }
          }
        }
      }
    });

    newFormData = {
      ...(typeof data === 'string' || Array.isArray(data) ? undefined : data),
      ...removeOldSchemaData,
      ...nestedData,
    };
    // First apply removing the old schema data, then apply the nested data, then apply the old data keys to keep
  } else if (oldSchema?.type === 'array' && newSchema?.type === 'array' && Array.isArray(data)) {
    let oldSchemaItems = oldSchema.items;
    let newSchemaItems = newSchema.items;
    // If any of the array types `items` are arrays (remember arrays are objects) then we'll just drop the data
    // Eventually, we may want to deal with when either of the `items` are arrays since those tuple validations
    if (
      typeof oldSchemaItems === 'object' &&
      typeof newSchemaItems === 'object' &&
      !Array.isArray(oldSchemaItems) &&
      !Array.isArray(newSchemaItems)
    ) {
      // Keep the raw (pre-resolution) items schema around: a conditional nested inside `items` must be
      // re-resolved per element below, against that element's own value, rather than the whole array (#5250)
      const oldSchemaItemsRaw = oldSchemaItems as S;
      const newSchemaItemsRaw = newSchemaItems as S;
      // Resolve refs, dependencies, if/then/else and allOf, not just a direct `$ref`, so the type check below
      // reflects an items schema whose object type is only reachable through one of those keywords (#5250)
      oldSchemaItems = retrieveSchema<T, S, F>(
        validator,
        oldSchemaItemsRaw,
        rootSchema,
        data as T,
        experimental_customMergeAllOf,
      );
      // The old and new raw items schema are usually identical, so skip resolving a second time in that common case
      newSchemaItems = deepEquals(oldSchemaItemsRaw, newSchemaItemsRaw)
        ? oldSchemaItems
        : retrieveSchema<T, S, F>(validator, newSchemaItemsRaw, rootSchema, data as T, experimental_customMergeAllOf);
      // Now get types and see if they are the same
      const oldSchemaType = getByPath(oldSchemaItems, 'type');
      const newSchemaType = getByPath(newSchemaItems, 'type');
      // Check if the old option has the same key with the same type
      if (!oldSchemaType || oldSchemaType === newSchemaType) {
        const maxItems = newSchema.maxItems ?? -1;
        if (newSchemaType === 'object') {
          newFormData = data.reduce((newValue, aValue) => {
            // Resolve refs, dependencies, if/then/else and allOf against this item's own value, so a conditional
            // nested inside `items` picks the branch that matches this element rather than the whole array (#5250)
            const oldItemSchema = retrieveSchema<T, S, F>(
              validator,
              oldSchemaItemsRaw,
              rootSchema,
              aValue,
              experimental_customMergeAllOf,
            );
            const newItemSchema = deepEquals(oldSchemaItemsRaw, newSchemaItemsRaw)
              ? oldItemSchema
              : retrieveSchema<T, S, F>(
                  validator,
                  newSchemaItemsRaw,
                  rootSchema,
                  aValue,
                  experimental_customMergeAllOf,
                );
            const itemValue = sanitizeDataForNewSchema<T, S, F>(
              validator,
              rootSchema,
              newItemSchema,
              oldItemSchema,
              aValue,
              experimental_customMergeAllOf,
            );
            if (itemValue !== undefined && (maxItems < 0 || newValue.length < maxItems)) {
              newValue.push(itemValue);
            }
            return newValue;
          }, []);
        } else {
          // Filter out items that are no longer valid in the new items schema (e.g., enum values that changed)
          const newItemEnumValues = enumValuesForSchema(newSchemaItems as S);
          const filteredData = newItemEnumValues
            ? data.filter((item: any) => newItemEnumValues.some((v: any) => deepEquals(v, item)))
            : data;
          newFormData = maxItems > 0 && filteredData.length > maxItems ? filteredData.slice(0, maxItems) : filteredData;
        }
      }
    } else if (
      typeof oldSchemaItems === 'boolean' &&
      typeof newSchemaItems === 'boolean' &&
      oldSchemaItems === newSchemaItems
    ) {
      // If they are both booleans and have the same value just return the data as is otherwise fall-thru to undefined
      newFormData = data;
    }
    // Also probably want to deal with `prefixItems` as tuples with the latest 2020 draft
  }
  // An array schema that produced no data above is cleared, whatever its `oneOf`/`anyOf`, and so is the absence of data
  if (newFormData === undefined && newSchema?.type !== 'array' && data !== undefined) {
    // Options that are the same on both sides mean the data changed within one `oneOf`/`anyOf`, rather than an option
    // switch (which passes the two resolved options) or a schema change, so its selected option is what to keep
    const options = xxxOfOptions<S>(newSchema);
    if (options && deepEquals(options, xxxOfOptions<S>(oldSchema))) {
      return sanitizeDataForSelectedOption<T, S, F>(
        validator,
        rootSchema,
        newSchema!,
        options,
        data,
        experimental_customMergeAllOf,
        oldData,
      );
    }
  }
  return newFormData as T;
}
