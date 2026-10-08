import { CONST_KEY, DEFAULT_KEY, GUESSED_TYPE_FLAG, PROPERTIES_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getPropertySchema from '../getPropertySchema.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import isObject from '../isObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import { getByPath, hasByPath } from '../pathUtils.ts';
import type { FormContextType, GenericObjectType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import retrieveSchema from './retrieveSchema.ts';

const NO_VALUE = Symbol('no Value');

function enumValuesForSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S): unknown[] | undefined {
  // An empty `enum` lists no value to check against, which is how the `anyOf`/`oneOf` below and `isConstantSelect()`
  // both read one, so it offers no constraint rather than rejecting everything
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum;
  }

  const xxxOfKey = getXxxOfKey<S>(schema);
  if (!xxxOfKey) {
    return undefined;
  }
  const options = schema[xxxOfKey] as (S | boolean)[];
  // An option with neither a `const` nor an `enum` accepts values beyond the listed ones, so a value outside them may
  // still be valid and there is no list to check it by
  if (!options.every((option) => isObject(option) && (CONST_KEY in option || Array.isArray(option.enum)))) {
    return undefined;
  }

  const values = (options as S[]).flatMap((option) => (CONST_KEY in option ? [option[CONST_KEY]] : option.enum!));

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

/** Sanitize the `data` associated with the `oldSchema` so it is considered appropriate for the `newSchema`. If the new
 * schema does not contain any properties, then `undefined` is returned to clear all the form data. Due to the nature
 * of schemas, this sanitization happens recursively for nested objects of data. Also, any properties in the old schema
 * that are non-existent in the new schema are set to `undefined`. The data sanitization process has the following flow:
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
 *       - If type of the key in the new schema is `object`, or `array` with array data, and the key isn't a select
 *         over object or array constants (see `isWholeValueSelect()`):
 *         - Store the value from the recursive `sanitizeDataForNewSchema` call in `nestedData[key]`
 *       - Otherwise, check for default, const or enum values:
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
 *         - If the form value is none of the new `enum` or constant options, replace it with the new `default` when that
 *           is an option, the only option when there is one, or undefined
 *   - Once all keys have been processed, return an object built as follows:
 *     - `{ ...data, ...removeOldSchemaData, ...nestedData }`
 * - If the new and old schema types are array and the `data` is an array then:
 *   - If the type of the old and new schema `items` are a non-array objects:
 *     - Retrieve the schema for any refs within each `oldKeySchema.items` and/or `newKeySchema.items`
 *     - If the `type`s of both items are the same (or the old does not have a type):
 *       - If the type is "object" and the items aren't a select over object constants (see `isWholeValueSelect()`),
 *         then:
 *         - For each element in the `data` recursively sanitize the data, stopping at `maxItems` if specified
 *       - Otherwise, return the `data` without the items that are none of the new `enum` or constant options, removing
 *         any values after `maxItems` if it is set. The filter is skipped when the raw old and new `items` schemas are
 *         equal and neither side was resolved against the current data into something else (no `if`/`then`,
 *         `dependencies`, `$ref` or `allOf` rewrote it on the way in), unless the items are a select over object or
 *         array constants
 *   - If the type of the old and new schema `items` are booleans of the same value, return `data` as is
 * - Otherwise return `undefined`
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param [newSchema] - The new schema for which the data is being sanitized
 * @param [oldSchema] - The old schema from which the data originated
 * @param [data={}] - The form data associated with the schema, defaulting to an empty object when undefined
 * @param [oldData] - The previous form data, which the old schema is resolved against when given. `Form`
 *      passes its previous `formData`, so a conditional that flipped between the previous and current data
 *      shows up as a real difference between the resolved old and new schemas, while a stable rewrite
 *      resolves the same on both sides. When omitted, the old schema is resolved against the current data,
 *      which is how existing direct callers behave
 * @returns - The new form data, with all the fields uniquely associated with the old schema set
 *      to `undefined`. Will return `undefined` if the new schema is not an object containing properties.
 */
export default function sanitizeDataForNewSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, rootSchema: S, newSchema?: S, oldSchema?: S, data: any = {}, oldData?: any): T {
  return sanitizeDataForNewSchemaInternal<T, S, F>(
    context,
    rootSchema,
    newSchema,
    oldSchema,
    data,
    oldData,
    false,
    false,
  );
}

/** Internal recursive implementation of `sanitizeDataForNewSchema()`, carrying the previous data the old
 * schema is resolved against and whether the old side covers this position at all.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema of the entire form
 * @param [newSchema] - The new schema for which the data is being sanitized
 * @param [oldSchema] - The old schema from which the data originated
 * @param [data={}] - The form data associated with the schema, defaulting to an empty object when undefined
 * @param [oldData] - The previous form data at this position; when undefined, the old schema is resolved
 *      against the current data
 * @param oldIsBorrowed - True when the old side is borrowed from the new schema because the old schema has
 *      no constraint for this position (a property the new schema introduces), so present data is filtered
 *      against the new schema even when the two sides resolve to the same thing
 * @param conditionalResolvedUpstream - True when an ancestor schema was resolved against the data into a
 *      different shape (a nested `if`/`then`, `dependencies`, `$ref` or `allOf`); only consulted when no
 *      previous data is available, where it preserves the historical filtering behavior
 * @returns - The sanitized form data
 */
function sanitizeDataForNewSchemaInternal<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  newSchema: S | undefined,
  oldSchema: S | undefined,
  data: any,
  oldData: any,
  oldIsBorrowed: boolean,
  conditionalResolvedUpstream: boolean,
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
      // The old side resolves against the previous value at this key, so a conditional that flipped between
      // the previous and current data shows up as a real difference between the resolved old and new schemas
      const oldFormValue = oldData === undefined ? formValue : oldData?.[key];
      const oldRawKeyedSchema = getPropertySchema<S>(oldSchema, key);
      const newRawKeyedSchema = getPropertySchema<S>(newSchema, key);
      // Resolve refs, dependencies, if/then/else and allOf so a dependency nested inside this key
      // (not just at the root schema) is taken into account when sanitizing its data (#5250)
      const oldKeyedSchema = retrieveSchema<T, S, F>(context, oldRawKeyedSchema, rootSchema, oldFormValue);
      // The old and new raw schema for a key are usually identical (most keys aren't touched by whatever changed)
      // and so are the previous and current values, so skip resolving (and re-running any oneOf/dependency
      // validity checks) a second time in that common case.
      const newKeyedSchema =
        deepEquals(oldRawKeyedSchema, newRawKeyedSchema) && deepEquals(oldFormValue, formValue)
          ? oldKeyedSchema
          : retrieveSchema<T, S, F>(context, newRawKeyedSchema, rootSchema, formValue);
      // Now get types and see if they are the same. A type that was guessed from the data of an `additionalProperties`
      // entry the schema puts no constraint on describes what that data was rather than what the schema requires, so
      // it is treated as no type at all: the data changing type is a change of data, not a change of schema. That only
      // holds while both sides are free to hold anything — once the new schema names a type of its own, it is that
      // type the data has to satisfy, so data of the type the old side merely happened to hold is still cleared
      const isUnconstrainedOnBothSides = GUESSED_TYPE_FLAG in oldKeyedSchema && GUESSED_TYPE_FLAG in newKeyedSchema;
      const oldSchemaTypeForKey = isUnconstrainedOnBothSides ? undefined : oldKeyedSchema.type;
      const newSchemaTypeForKey = newKeyedSchema.type;
      // Check if the old option has the same key with the same type
      if (!oldSchemaTypeForKey || oldSchemaTypeForKey === newSchemaTypeForKey) {
        if (key in removeOldSchemaData) {
          // SIDE-EFFECT: remove the undefined value for a key that has the same type between the old and new schemas
          delete removeOldSchemaData[key];
        }
        // If it is an object, we'll recurse and store the resulting sanitized data for the key. A select over object or
        // array constants holds one of them as a whole, so it's checked against its options like any other select
        const isContainer =
          (newSchemaTypeForKey === 'object' || (newSchemaTypeForKey === 'array' && Array.isArray(formValue))) &&
          !isWholeValueSelect<S>(newKeyedSchema);
        if (isContainer) {
          // SIDE-EFFECT: process the new schema type of object recursively to save iterations. A position the
          // old schema does not cover borrows the new schema as its old side (an array property the new schema
          // introduces), so its data is filtered against the new schema without manufacturing a fake difference
          const borrowOld = oldIsBorrowed || (isNewProperty && newSchemaTypeForKey === 'array');
          const itemData = sanitizeDataForNewSchemaInternal<T, S, F>(
            context,
            rootSchema,
            newKeyedSchema,
            borrowOld ? newKeyedSchema : oldKeyedSchema,
            formValue,
            // Only real previous data counts: without it the level below keeps the historical behavior,
            // with the old side still resolved against the current value (see `oldFormValue`)
            oldData === undefined ? undefined : oldFormValue,
            borrowOld,
            conditionalResolvedUpstream ||
              !deepEquals(oldKeyedSchema, oldRawKeyedSchema) ||
              !deepEquals(newKeyedSchema, newRawKeyedSchema),
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
          if (newOptionDefault !== NO_VALUE && !deepEquals(newOptionDefault, formValue)) {
            if ((isNewProperty && formValue === undefined) || deepEquals(oldOptionDefault, formValue)) {
              // Initialize a newly entered property or replace an old default with the new default.
              removeOldSchemaData[key] = newOptionDefault;
            } else if (newKeyedSchema.readOnly === true) {
              // If the new schema has the default set to read-only, treat it like a const and remove the value
              removeOldSchemaData[key] = undefined;
            }
          }

          const newOptionConst = getByPath(newKeyedSchema, CONST_KEY, NO_VALUE);
          const oldOptionConst = getByPath(oldKeyedSchema, CONST_KEY, NO_VALUE);
          if (newOptionConst !== NO_VALUE && !deepEquals(newOptionConst, formValue)) {
            // Since this is a const, if the old value matches, replace the value with the new const otherwise clear it
            removeOldSchemaData[key] = deepEquals(oldOptionConst, formValue) ? newOptionConst : undefined;
          }

          // When previous data is available, the enum replacement only runs when the constraint could have
          // changed: the position is borrowed (the old schema never covered it) or the resolved old and new
          // schemas differ. When they are the same, a value the schema once offered is kept, the way the
          // array path keeps it. Without previous data there is nothing to compare against, so the
          // historical always-replace behavior is preserved
          if (
            hasByPath(data, key) &&
            (oldData === undefined || oldIsBorrowed || !deepEquals(oldKeyedSchema, newKeyedSchema))
          ) {
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
      // reflects an items schema whose object type is only reachable through one of those keywords (#5250).
      // The old side resolves against the previous array, so a conditional that flipped between the previous
      // and current data shows up as a real difference between the resolved old and new items schemas
      oldSchemaItems = retrieveSchema<T, S, F>(
        context,
        oldSchemaItemsRaw,
        rootSchema,
        (oldData === undefined ? data : oldData) as T,
      );
      // The old and new raw items schema are usually identical and so are the previous and current arrays,
      // so skip resolving a second time in that common case. Neither changes per element, so compare them
      // once rather than inside the per-element loop below
      const sameItemsSchema =
        deepEquals(oldSchemaItemsRaw, newSchemaItemsRaw) && (oldData === undefined || deepEquals(oldData, data));
      newSchemaItems = sameItemsSchema
        ? oldSchemaItems
        : retrieveSchema<T, S, F>(context, newSchemaItemsRaw, rootSchema, data as T);
      // Now get types and see if they are the same
      const oldSchemaType = getByPath(oldSchemaItems, 'type');
      const newSchemaType = getByPath(newSchemaItems, 'type');
      // Check if the old option has the same key with the same type
      if (!oldSchemaType || oldSchemaType === newSchemaType) {
        const maxItems = newSchema.maxItems ?? -1;
        // An item picked from object constants is one of them as a whole, so it's filtered against the options below
        // rather than sanitized property by property, which would find no properties and drop it
        if (newSchemaType === 'object' && !isWholeValueSelect<S>(newSchemaItems as S)) {
          newFormData = data.reduce<unknown[]>((newValue, aValue: T, index: number) => {
            // Resolve refs, dependencies, if/then/else and allOf against this item's own value, so a conditional
            // nested inside `items` picks the branch that matches this element rather than the whole array (#5250).
            // The old side resolves against the previous element at the same index: pairing by index is the only
            // rule that needs no identity of its own, and it means an insert, remove or reorder compares an
            // element against a different element's previous value. An element with no previous element at its
            // index resolves the old side without data
            const oldElement = oldData === undefined ? aValue : oldData?.[index];
            const oldItemSchema = retrieveSchema<T, S, F>(context, oldSchemaItemsRaw, rootSchema, oldElement);
            const newItemSchema =
              deepEquals(oldSchemaItemsRaw, newSchemaItemsRaw) && deepEquals(oldElement, aValue)
                ? oldItemSchema
                : retrieveSchema<T, S, F>(context, newSchemaItemsRaw, rootSchema, aValue);
            const itemValue = sanitizeDataForNewSchemaInternal<T, S, F>(
              context,
              rootSchema,
              newItemSchema,
              oldItemSchema,
              aValue,
              oldData === undefined ? undefined : oldElement,
              oldIsBorrowed,
              conditionalResolvedUpstream ||
                !deepEquals(oldSchemaItems, oldSchemaItemsRaw) ||
                !deepEquals(newSchemaItems, newSchemaItemsRaw),
            );
            if (itemValue !== undefined && (maxItems < 0 || newValue.length < maxItems)) {
              newValue.push(itemValue);
            }
            return newValue;
          }, []);
        } else {
          // Filter out items that are no longer valid in the new items schema (e.g., enum values that changed).
          // With previous data available, the filter is skipped when the resolved old and new items schemas
          // are the same: values entered while the schema offered them are kept rather than silently dropped
          // by an unrelated sanitize pass (#5451). Because the old side resolves against the previous data, a
          // conditional that flipped between the previous and current data shows up as a real difference and
          // the filter still runs (#5250), while a stable rewrite (a nested `allOf`, `$ref` or
          // `additionalProperties` stub, or an unrelated conditional on an ancestor) resolves the same on
          // both sides and keeps the skip. Without previous data there is nothing to compare against, so the
          // historical gates decide instead: an unchanged raw items schema skips the filter unless either
          // side resolved into a different shape or an ancestor did. A position the old schema does not
          // cover is filtered against the new schema, since the schema never offered those values. A select
          // over object/array constants also still filters an unchanged items schema, since it holds each
          // item as a whole (see `isWholeValueSelect()`)
          const newItemEnumValues = enumValuesForSchema(newSchemaItems as S);
          const itemsResolvedAsWritten =
            deepEquals(oldSchemaItems, oldSchemaItemsRaw) && deepEquals(newSchemaItems, newSchemaItemsRaw);
          const shouldFilter =
            oldIsBorrowed ||
            isWholeValueSelect<S>(newSchemaItems as S) ||
            (oldData === undefined
              ? !sameItemsSchema || !itemsResolvedAsWritten || conditionalResolvedUpstream
              : !deepEquals(oldSchemaItems, newSchemaItems));
          const filteredData =
            newItemEnumValues && shouldFilter
              ? data.filter((item: any) => newItemEnumValues.some((v: any) => deepEquals(v, item)))
              : data;
          // `maxItems` of 0 allows no item at all, which is how the per-element path above reads it too
          newFormData =
            maxItems >= 0 && filteredData.length > maxItems ? filteredData.slice(0, maxItems) : filteredData;
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
  return newFormData as T;
}
