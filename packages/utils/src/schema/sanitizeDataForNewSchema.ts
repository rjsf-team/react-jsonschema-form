import { CONST_KEY, DEFAULT_KEY, GUESSED_TYPE_FLAG, ITEMS_KEY, PROPERTIES_KEY } from '../constants.ts';
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
 *           is an option, the only option when there is one, or undefined; when the previous form data is passed,
 *           the replacement only runs where the old and new keyed schemas, each resolved against its own data,
 *           disagree
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
 *         any values after `maxItems` if it is set. When the previous form data is passed (the way `Form` calls it),
 *         the filter is skipped where the old and new `items` schemas, each resolved against its own array, agree;
 *         without it the filter always runs. The same comparison decides whether a scalar value outside the new
 *         `enum` or constant options is replaced. A select over object or array constants is always filtered, since
 *         it holds each item as a whole
 *   - If the type of the old and new schema `items` are booleans of the same value, return `data` as is
 * - Otherwise return `undefined`
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param [newSchema] - The new schema for which the data is being sanitized
 * @param [oldSchema] - The old schema from which the data originated
 * @param [data={}] - The form data associated with the schema, defaulting to an empty object when undefined
 * @param [oldData] - The previous form data, used only to decide whether the enum filter runs: when given
 *      (which `Form` does, passing its previous `formData`), the filter is skipped at a position whose old and
 *      new schemas, each resolved against its own data, agree. When omitted, the filter always runs
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
    oldData === undefined ? NO_VALUE : oldData,
    false,
    oldData === undefined ? undefined : oldSchema,
  );
}

/** Internal recursive implementation of `sanitizeDataForNewSchema()`, carrying the previous data the enum
 * filter decision is made with and whether the old side covers this position at all.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema of the entire form
 * @param [newSchema] - The new schema for which the data is being sanitized
 * @param [oldSchema] - The old schema from which the data originated
 * @param [data={}] - The form data associated with the schema, defaulting to an empty object when undefined
 * @param [oldData] - The previous data at this position, or `NO_VALUE` when the caller passed no previous
 *      data at all; a position simply missing from the previous data arrives as an `undefined` value, so the
 *      two cases stay apart
 * @param oldIsBorrowed - True when the old side is borrowed from the new schema because the old schema has
 *      no constraint for this position (a property the new schema introduces), so present data is filtered
 *      against the new schema even when the two sides resolve to the same thing
 * @param [oldSchemaPrev] - The old schema as the previous data resolves it at this position, or undefined
 *      when no previous data was passed. Only the enum filter decisions read it: resolving the old side
 *      against the previous data at every level lets an ancestor conditional that flipped between the
 *      previous and current data show up as a real difference where the filter runs
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
  oldSchemaPrev?: S,
): T {
  // By default, we will clear the form data
  let newFormData;
  // The filter chain: the old schema resolved against the previous data. A position missing from the
  // previous data resolves it without data (a previous value of `undefined`), so a conditional an ancestor
  // flip controls resolves the way the previous data saw it
  const oldSchemaPrevResolved =
    oldSchemaPrev === undefined
      ? undefined
      : retrieveSchema<T, S, F>(context, oldSchemaPrev, rootSchema, oldData === NO_VALUE ? undefined : oldData);
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
      // Resolve refs, dependencies, if/then/else and allOf against the current data, so a dependency nested
      // inside this key (not just at the root schema) is taken into account when sanitizing its data (#5250).
      // The previous data only feeds the enum filter decision below; field removal, the type check and the
      // default/const swap all read the schema as the current data resolves it
      const oldKeyedSchema = retrieveSchema<T, S, F>(context, oldRawKeyedSchema, rootSchema, formValue);
      // The old and new raw schema for a key are usually identical (most keys aren't touched by whatever changed),
      // so skip resolving (and re-running any oneOf/dependency validity checks) a second time in that common case.
      const newKeyedSchema = deepEquals(oldRawKeyedSchema, newRawKeyedSchema)
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
            // A key missing from the previous data is a previous value of `undefined`, not "no previous
            // data": only the caller omitting previous data altogether passes `NO_VALUE` down
            oldData === NO_VALUE ? NO_VALUE : oldData?.[key],
            borrowOld,
            oldSchemaPrevResolved === undefined ? undefined : getPropertySchema<S>(oldSchemaPrevResolved, key),
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

          // The enum replacement always runs for a borrowed position (the old schema never covered it) and
          // when no previous data was passed. With previous data it only runs when the constraint could have
          // changed: the old schema resolved against the previous value differs from the new schema resolved
          // against the current one. When the two agree, a value the schema offered when it was entered is
          // kept, the way the array path keeps it. The comparison reads the filter chain, which resolves the
          // old side against the previous data at every level, so an ancestor conditional that flipped
          // between the previous and current data shows up as a real difference here (#5250). It runs only
          // when a replacement would actually happen, since it costs a resolve and a deep compare
          if (hasByPath(data, key)) {
            const enumReplacement = replacementForInvalidEnumValue(newKeyedSchema, formValue);
            if (enumReplacement !== NO_VALUE) {
              let shouldReplace = true;
              if (!oldIsBorrowed && oldSchemaPrevResolved !== undefined) {
                const oldFilterSchema = retrieveSchema<T, S, F>(
                  context,
                  getPropertySchema<S>(oldSchemaPrevResolved, key),
                  rootSchema,
                  oldData?.[key],
                );
                shouldReplace = !deepEquals(oldFilterSchema, newKeyedSchema);
              }
              if (shouldReplace) {
                removeOldSchemaData[key] = enumReplacement;
              }
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
      // Resolve refs, dependencies, if/then/else and allOf against the current array, not just a direct
      // `$ref`, so the type check below reflects an items schema whose object type is only reachable through
      // one of those keywords (#5250). The previous data only feeds the enum filter decision below, through
      // the filter chain's own items schema
      const oldSchemaItemsPrevRaw = oldSchemaPrevResolved?.[ITEMS_KEY] as S | undefined;
      oldSchemaItems = retrieveSchema<T, S, F>(context, oldSchemaItemsRaw, rootSchema, data as T);
      // The old and new raw items schema are usually identical, so skip resolving a second time in that
      // common case. The raw comparison does not change per element, so it is computed once here rather
      // than inside the per-element loop below
      const sameRawItemsSchema = deepEquals(oldSchemaItemsRaw, newSchemaItemsRaw);
      newSchemaItems = sameRawItemsSchema
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
            // nested inside `items` picks the branch that matches this element rather than the whole array (#5250)
            const oldItemSchema = retrieveSchema<T, S, F>(context, oldSchemaItemsRaw, rootSchema, aValue);
            const newItemSchema = sameRawItemsSchema
              ? oldItemSchema
              : retrieveSchema<T, S, F>(context, newSchemaItemsRaw, rootSchema, aValue);
            const itemValue = sanitizeDataForNewSchemaInternal<T, S, F>(
              context,
              rootSchema,
              newItemSchema,
              oldItemSchema,
              aValue,
              // Pairing by index is the only rule that needs no identity of its own. An insert, remove or
              // reorder compares an element against a different element's previous value, but a wrong pair
              // can only get the enum filter decision below wrong - removal, the type check and the
              // default/const swap all read the schema as this element resolves it
              oldData === NO_VALUE ? NO_VALUE : oldData?.[index],
              oldIsBorrowed,
              oldSchemaItemsPrevRaw,
            );
            if (itemValue !== undefined && (maxItems < 0 || newValue.length < maxItems)) {
              newValue.push(itemValue);
            }
            return newValue;
          }, []);
        } else {
          // Filter out items that are no longer valid in the new items schema (e.g., enum values that
          // changed). The filter always runs for a borrowed position (the old schema never covered it), for
          // a select over object or array constants, which holds each item as a whole (see
          // `isWholeValueSelect()`), and when no previous data was passed. With previous data it is skipped
          // when the old items schema resolved against the previous array agrees with the new one resolved
          // against the current array: values entered while the schema offered them are kept rather than
          // silently dropped by an unrelated sanitize pass (#5451), while a conditional that flipped between
          // the previous and current data shows up as a real difference and the filter still runs (#5250).
          // The comparison runs only when some item would actually be dropped, since it can cost a resolve
          const newItemEnumValues = enumValuesForSchema(newSchemaItems as S);
          let shouldFilter = true;
          if (
            !oldIsBorrowed &&
            !isWholeValueSelect<S>(newSchemaItems as S) &&
            oldSchemaPrevResolved !== undefined &&
            newItemEnumValues &&
            data.some((item: any) => !newItemEnumValues.some((v: any) => deepEquals(v, item)))
          ) {
            const oldItemsForFilter =
              sameRawItemsSchema && deepEquals(oldSchemaItemsPrevRaw, newSchemaItemsRaw) && deepEquals(oldData, data)
                ? oldSchemaItems
                : retrieveSchema<T, S, F>(context, oldSchemaItemsPrevRaw as S, rootSchema, oldData as T);
            shouldFilter = !deepEquals(oldItemsForFilter, newSchemaItems);
          }
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
