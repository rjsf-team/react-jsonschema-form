import { CONST_KEY, DEFAULT_KEY, GUESSED_TYPE_FLAG, PROPERTIES_KEY } from '../constants.ts';
import constIsAjvDataReference from '../constIsAjvDataReference.ts';
import deepEquals from '../deepEquals.ts';
import getPropertySchema from '../getPropertySchema.ts';
import getSchemaType from '../getSchemaType.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import hasSchemaMarker from '../hasSchemaMarker.ts';
import isContainerValue from '../isContainerValue.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import isPlainObject from '../isPlainObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import { getByPath, hasByPath } from '../pathUtils.ts';
import type { FormContextType, GenericObjectType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import { ownValue } from './getDefaultFormState.ts';
import resolveConstantOptions from './resolveConstantOptions.ts';
import retrieveSchema, { ownRefResolves } from './retrieveSchema.ts';

const NO_VALUE = Symbol('no Value');

/** The keywords that describe an array's items by position, or that leave them undescribed when none is declared */
const TUPLE_KEYWORDS = ['items', 'prefixItems', 'additionalItems'] as const;
const ITEMS_KEYWORDS = ['items', 'prefixItems'] as const;

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

/** Returns the values the old schema's select lists, its constant options written as `$ref`s read as the definitions
 * they name under `rootSchema`, as the new schema's are read. The old schema can come from another root, where an
 * option's `$ref` names nothing under this one: such a list lists no values, so it agrees with no list the new schema
 * offers, and the new schema's options decide.
 *
 * @param oldSchema - The old schema
 * @param rootSchema - The root schema of the new schema
 * @returns - The values the select lists, or undefined when it lists none
 */
function oldListedValues<S extends StrictRJSFSchema = RJSFSchema>(oldSchema: S, rootSchema: S): unknown[] | undefined {
  const options = getXxxOfOptions<S>(oldSchema)?.options ?? [];
  return options.every((option) => !isSchemaObject<S>(option) || ownRefResolves<S>(option, rootSchema))
    ? enumValuesForSchema<S>(resolveConstantOptions<S>(oldSchema, rootSchema))
    : undefined;
}

/** What `data` is replaced with where `newSchema` declares an object or array `const` that `sanitized`, the data once
 * sanitized, isn't, and `oldSchema` didn't declare the same one, or `NO_VALUE` where the `const` doesn't reject it. An
 * object `const` is read as `constIsAjvDataReference()` reads it, as the defaults do. An array is compared with an
 * object `const` only where the schema declares `type: 'object'`, since an ajv `$data` reference is an object. A `const`
 * the old schema already declared was rejecting the data before the switch too, so the data is kept for validation to
 * report rather than dropped.
 *
 * The replacement is a copy of the new `const` where `data` holds the old one, as a scalar property's is, and otherwise
 * nothing, which clears a property and drops an array item. Copied as the defaults copy it, so neither the schema nor
 * another item replaced alike shares an object the caller may change
 */
function constReplacement<S extends StrictRJSFSchema = RJSFSchema>(
  newSchema: S,
  oldSchema: S | undefined,
  sanitized: unknown,
  data: unknown,
): unknown {
  const newConst: unknown = newSchema.const;
  const isValueConst =
    Array.isArray(newConst) ||
    ((!Array.isArray(sanitized) || newSchema.type === 'object') &&
      isPlainObject(newConst) &&
      !constIsAjvDataReference<S>(newSchema));
  if (!isValueConst || deepEquals(newConst, sanitized) || deepEquals(oldSchema?.const, newConst)) {
    return NO_VALUE;
  }
  return deepEquals(oldSchema?.const, data) ? ownValue(newConst) : undefined;
}

/** Whether two schemas' `type`s name the same types. A list is compared by what it names rather than by identity or
 * order, since the two schemas declaring it are usually separate objects and `['null', 'string']` allows what
 * `['string', 'null']` does
 */
function isSameType(oldType: unknown, newType: unknown): boolean {
  if (oldType === newType) {
    return true;
  }
  if (!Array.isArray(oldType) || !Array.isArray(newType)) {
    return false;
  }
  const newTypes = new Set<unknown>(newType);
  const oldTypes = new Set<unknown>(oldType);
  return oldTypes.size === newTypes.size && oldType.every((type) => newTypes.has(type));
}

/** What `formValue`, data holding no object, is sanitized to against the object schema `schema`: an empty object in
 * place of a value of another type where it declares `properties`, and otherwise nothing. Absent data stays absent, so
 * the defaults decide whether the object is added, as they do when the form mounts
 */
function emptyObjectFor<S extends StrictRJSFSchema>(schema: S, formValue: unknown): object | undefined {
  return formValue !== undefined && schema[PROPERTIES_KEY] ? {} : undefined;
}

function replacementForInvalidEnumValue<S extends StrictRJSFSchema = RJSFSchema>(schema: S, formValue: unknown) {
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
 * that are non-existent in the new schema, or that it declares with another type, are removed from the data at every
 * level. The data sanitization process has the following flow:
 *
 * - If the `data` is an object or array equal to the new schema's `const`, return it as it is
 * - If the new schema is an object that contains a `properties` object then:
 *   - Create an empty `replacements` object, and a set of `discardedKeys` holding each key in the
 *     `oldSchema.properties` having `data`
 *   - Create an empty `nestedData` object for use in the key filtering below:
 *   - Iterate over each key in the `newSchema.properties` as follows:
 *     - Get the `formValue` of the key from the `data`
 *     - Get the `oldKeySchema` and `newKeyedSchema` for the key, defaulting to `{}` when it doesn't exist
 *     - Retrieve the schema for any refs within each `oldKeySchema` and/or `newKeySchema`
 *     - Get the types of the old and new keyed schemas and if the old doesn't exist or the old & new are the same then:
 *       - Delete the key from `discardedKeys`, since the new schema has the same property
 *       - If type of the key in the new schema is `object`, or `array` with array data, and the key isn't a select
 *         over object or array constants (see `isWholeValueSelect()`):
 *         - Store the value from the recursive `sanitizeDataForNewSchema` call in `nestedData[key]`, or, for data that
 *           holds a value other than an object, an empty object when the new schema declares `properties`. Data the
 *           key does not hold is left out, and a `null` is removed, for the defaults to fill as they do on mount. What
 *           the new `const` rejects once sanitized, as below, takes the new `const` or is cleared
 *       - Otherwise, check for default, const or enum values:
 *         - Get the old and new `default` values from the schema and check:
 *           - If the new `default` value does not match the form value:
 *             - If the key is new and its form value is undefined, or the old `default` matches the form value, then:
 *               - Replace `replacements[key]` with the new `default`
 *               - Otherwise, if the new schema is `readOnly` then replace `replacements[key]` with undefined
 *         - Get the old and new `const` values from the schema and check:
 *           - If the new `const` value does not match the form value:
 *           - If the old `const` value DOES match the form value, then:
 *             - Replace `replacements[key]` with the new `const`
 *             - Otherwise, replace `replacements[key]` with undefined
 *         - If the form value is none of the new `enum` or constant options, replace it with the new `default` when that
 *           is an option, the only option when there is one, or undefined
 *   - Once all keys have been processed, return `{ ...data, ...replacements, ...nestedData }` without the keys
 *     left in `discardedKeys`
 * - If the new schema type, read through `getSchemaType()` so that a type list also allowing `null` counts, is array,
 *   the old schema's is too or it declares none, the `data` is an array, and the `data` is one of the new schema's
 *   `enum` or constant options when it lists any the old schema did not list alike, the options of both read with
 *   their `$ref`s resolved against `rootSchema`, where an old option whose `$ref` names nothing there lists no values,
 *   then:
 *   - An old schema declaring no type, or an array declaring no `items` or `items: true` and no `prefixItems`, has its
 *     `items` read as `{}`, which constrains nothing. An untyped one also describes a tuple, `items: true` or no
 *     `items` alike
 *   - If the old and new schema `items` are both a single schema rather than a tuple or a boolean, and the new schema
 *     declares no `prefixItems` where the old schema declares no type:
 *     - Retrieve the schema for any refs within each `oldKeySchema.items` and/or `newKeySchema.items`
 *     - If the `type`s of both items are the same (or the old does not have a type):
 *       - If the new items' type, read through `getSchemaType()`, is "object" or "array" and the items aren't a select
 *         over object or array constants (see `isWholeValueSelect()`), then, for each element in the `data`, stopping
 *         at `maxItems` if specified:
 *         - Retrieve the items schemas for that element, and keep an element that is one of the new items
 *           schema's `enum` or constant options as it is, dropping one that is none of them
 *         - Otherwise, an object element whose new items schema declares `properties` is recursively sanitized against
 *           them, and any other object element is kept as it is. A value that is not an object, other than `undefined`,
 *           is dropped where the new items declare `type: 'object'`, except a `null` that `nullable: true` allows
 *         - Otherwise, an array element is recursively sanitized, and kept as it is when that returns `undefined`
 *         - An element the new items' `const` rejects once sanitized, as below, takes the new `const` where it holds
 *           the old one, and is dropped otherwise
 *         - For array items, an element that is not an array is kept as it is unless the options don't list it. Under
 *           a type list for object items, so is an element that is not an object, such as a `null` the list allows
 *       - Otherwise, return the `data` without the items that are none of the new `enum` or constant options, removing
 *         any values after `maxItems` if it is set
 *   - Otherwise, if both schemas declare the same `items` and `prefixItems`, and the same `additionalItems` where
 *     either `items` is a tuple, as a tuple, a boolean `items` or an array declaring no `items` does, or the old schema
 *     declares no type and the new one declares neither `items: false` nor `additionalItems: false` beside a tuple
 *     `items`, return the `data`, removing any values after the
 *     new `maxItems` if it is set
 * - Otherwise return `undefined`, which clears an array the new schema's `enum` or constant options do not list, where
 *   the old schema declared a different list
 * - Last, if the new `const` is an object or array that the sanitized `data`, or the `data` where that is `undefined`,
 *   isn't, and the old schema didn't declare the same `const`, return a copy of the new `const` where the `data` equals
 *   the old one, and `undefined` otherwise
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param [newSchema] - The new schema for which the data is being sanitized
 * @param [oldSchema] - The old schema from which the data originated
 * @param [data={}] - The form data associated with the schema, defaulting to an empty object when undefined
 * @returns - The new form data, without the fields uniquely associated with the old schema. Will return `undefined` if
 *      the new schema is not an object containing properties, or where its object or array `const` rejects the data, and
 *      a copy of that `const` where the data holds the old schema's
 */
export default function sanitizeDataForNewSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, rootSchema: S, newSchema?: S, oldSchema?: S, data: unknown = {}): T {
  // Data equal to the new `const` is the one value the schema allows, so sanitizing it could only change it into one the
  // `const` rejects. A scalar is left to the rules below
  if (newSchema?.const !== undefined && isContainerValue(data) && deepEquals(newSchema.const, data)) {
    return data as T;
  }
  // By default, we will clear the form data
  let newFormData;
  const newProperties = newSchema?.[PROPERTIES_KEY];
  // If the new schema is of type object and that object contains a list of properties
  if (newProperties) {
    // An object of the values replacing the data's own. It and `nestedData` are without a prototype, so that a
    // `__proto__` key is written as a plain key, and the spread into `newFormData` copies it as an own one
    const replacements: GenericObjectType = Object.create(null);
    // The keys the old schema declares that the data holds, each removed from the data unless the new schema declares
    // it with the same type. Removed rather than set to `undefined`, which a nested object's field would read as an
    // extra key, and which would keep the defaults from reaching the key
    const discardedKeys = new Set<string>();
    const oldProperties = oldSchema?.[PROPERTIES_KEY];
    if (oldProperties) {
      Object.keys(oldProperties).forEach((key) => {
        if (hasByPath(data, key)) {
          discardedKeys.add(key);
        }
      });
    }
    const keys: string[] = Object.keys(newProperties);
    // Create a place to store nested data that will be a side-effect of the filter
    const nestedData: GenericObjectType = Object.create(null);
    keys.forEach((key) => {
      const formValue = getByPath(data, key);
      const isNewProperty = !hasByPath(oldSchema, [PROPERTIES_KEY, key]);
      const oldRawKeyedSchema = getPropertySchema<S>(oldSchema, key);
      const newRawKeyedSchema = getPropertySchema<S>(newSchema, key);
      // Resolve refs, dependencies, if/then/else and allOf against the current data, so a dependency nested
      // inside this key (not just at the root schema) is taken into account when sanitizing its data (#5250)
      const oldKeyedSchema = retrieveSchema<unknown, S, F>(context, oldRawKeyedSchema, rootSchema, formValue);
      // The old and new raw schema for a key are usually the same object (most keys aren't touched by whatever
      // changed, and a schema `Form` re-resolves keeps the subschemas that did not change), so skip resolving (and
      // re-running any oneOf/dependency validity checks) a second time in that common case.
      const newKeyedSchema =
        oldRawKeyedSchema === newRawKeyedSchema
          ? oldKeyedSchema
          : retrieveSchema<unknown, S, F>(context, newRawKeyedSchema, rootSchema, formValue);
      // Now get types and see if they are the same. A type that was guessed from the data of an `additionalProperties`
      // entry the schema puts no constraint on describes what that data was rather than what the schema requires, so
      // it is treated as no type at all: the data changing type is a change of data, not a change of schema. That only
      // holds while both sides are free to hold anything — once the new schema names a type of its own, it is that
      // type the data has to satisfy, so data of the type the old side merely happened to hold is still cleared
      const isUnconstrainedOnBothSides =
        hasSchemaMarker(oldKeyedSchema, GUESSED_TYPE_FLAG) && hasSchemaMarker(newKeyedSchema, GUESSED_TYPE_FLAG);
      const oldSchemaTypeForKey = isUnconstrainedOnBothSides ? undefined : oldKeyedSchema.type;
      const newSchemaTypeForKey = newKeyedSchema.type;
      // Check if the old option has the same key with the same type
      if (!oldSchemaTypeForKey || isSameType(oldSchemaTypeForKey, newSchemaTypeForKey)) {
        discardedKeys.delete(key);
        // If it is an object, we'll recurse and store the resulting sanitized data for the key. A select over object or
        // array constants holds one of them as a whole, so it's checked against its options like any other select
        // A container is read through `getSchemaType()`, as the array branch below reads it, so one whose type list also
        // allows `null` is sanitized as a plain array or object is, when it holds one: a `null` it allows stays as it
        // is. Only a declared type counts: `getSchemaType()` guesses `array` from a typeless `const` array, which has no
        // `items` to sanitize its value against and would be cleared
        const containerType = newSchemaTypeForKey === undefined ? undefined : getSchemaType<S>(newKeyedSchema);
        const isArrayValue = containerType === 'array' && Array.isArray(formValue);
        // A `null` that `nullable: true` allows stays as it is, as one a type list allows does
        const isAllowedNull = formValue === null && newKeyedSchema.nullable === true;
        const isObjectValue =
          (newSchemaTypeForKey === 'object' && !isAllowedNull) ||
          (containerType === 'object' && isPlainObject(formValue));
        const isContainer = (isObjectValue || isArrayValue) && !isWholeValueSelect<S>(newKeyedSchema);
        if (isContainer && formValue === null) {
          // `null` holds no object, as the Optional Data Controls read it, so it is removed as absent data is left out,
          // for the defaults to fill, rather than replaced by an empty object that shows the object as added, unless it
          // is the old `const` the new one replaces. Only an object schema reaches here with it: a type list or
          // `nullable: true` allowing `null` keeps it as a scalar
          const replacement = constReplacement<S>(newKeyedSchema, oldKeyedSchema, null, null);
          if (replacement === NO_VALUE || replacement === undefined) {
            discardedKeys.add(key);
          } else {
            nestedData[key] = replacement;
          }
        } else if (isContainer) {
          // SIDE-EFFECT: process the new schema type of object recursively to save iterations. Data holding no object
          // has no properties to sanitize. Descending into it would sanitize the absent properties of every level a
          // recursive `$ref` reaches, without end
          const sanitizedData: unknown =
            isArrayValue || isPlainObject(formValue)
              ? sanitizeDataForNewSchema<T, S, F>(context, rootSchema, newKeyedSchema, oldKeyedSchema, formValue)
              : emptyObjectFor<S>(newKeyedSchema, formValue);
          // What the new `const` rejects, the empty object standing in for data of another type or the data itself
          // where there is none, takes the new `const` where the data holds the old one, and is otherwise cleared
          const replacement =
            formValue === undefined
              ? NO_VALUE
              : constReplacement<S>(newKeyedSchema, oldKeyedSchema, sanitizedData ?? formValue, formValue);
          const itemData = replacement === NO_VALUE ? sanitizedData : replacement;
          // `undefined` clears an array, and a value the new `const` rejects. For any other object it means the new
          // schema declares no `properties` to sanitize it by, and the object is kept as it is
          if (itemData !== undefined || isArrayValue || replacement !== NO_VALUE) {
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
              replacements[key] = newOptionDefault;
            } else if (newKeyedSchema.readOnly === true) {
              // If the new schema has the default set to read-only, treat it like a const and remove the value
              replacements[key] = undefined;
            }
          }

          const newOptionConst = getByPath(newKeyedSchema, CONST_KEY, NO_VALUE);
          const oldOptionConst = getByPath(oldKeyedSchema, CONST_KEY, NO_VALUE);
          if (newOptionConst !== NO_VALUE && !deepEquals(newOptionConst, formValue)) {
            // Since this is a const, if the old value matches, replace the value with the new const otherwise clear it
            replacements[key] = deepEquals(oldOptionConst, formValue) ? ownValue(newOptionConst) : undefined;
          }

          if (hasByPath(data, key)) {
            const enumReplacement = replacementForInvalidEnumValue(newKeyedSchema, formValue);
            if (enumReplacement !== NO_VALUE) {
              replacements[key] = enumReplacement;
            }
          }
        }
      }
    });

    const sanitized: GenericObjectType = {
      ...(isObject(data) ? data : undefined),
      ...replacements,
      ...nestedData,
    };
    discardedKeys.forEach((key) => delete sanitized[key]);
    newFormData = sanitized;
  } else if (
    // Read through `getSchemaType()`, as the field rendering each schema is picked, so an array whose type list also
    // allows `null` keeps its items as a plain array does
    oldSchema &&
    newSchema &&
    // An old schema declaring no type allows any value, so nothing marks an array it held as stale
    (oldSchema.type === undefined || getSchemaType<S>(oldSchema) === 'array') &&
    getSchemaType<S>(newSchema) === 'array' &&
    Array.isArray(data) &&
    // A select over whole arrays holds one of its values, so an array it does not list is cleared as well, unless the
    // old schema listed the same values, for the same reason. Its constant options are read as the property's are
    (replacementForInvalidEnumValue<S>(resolveConstantOptions<S>(newSchema, rootSchema), data) === NO_VALUE ||
      deepEquals(
        oldListedValues<S>(oldSchema, rootSchema),
        enumValuesForSchema<S>(resolveConstantOptions<S>(newSchema, rootSchema)),
      ))
  ) {
    // An old schema declaring no type, or an array declaring no `items` or `items: true` and no `prefixItems`, puts no
    // constraint on the items, so they are read against the new items alone, with an old side declaring none of the new
    // items' `const` and options, which the checks comparing the two would otherwise find on both sides. Only an
    // untyped one describes a tuple alike, below, since a typed one declaring no `items` already does when the new one
    // declares none either
    const oldIsUntyped = oldSchema.type === undefined;
    // A type guessed from the data describes what the data was rather than a schema, so it isn't read this way, and an
    // array holding it is still cleared once the new schema declares items of its own
    const oldConstrainsNoItems =
      oldIsUntyped ||
      (!hasSchemaMarker(oldSchema, GUESSED_TYPE_FLAG) &&
        // The items below are read against the new `items` alone, which would shift the ones new `prefixItems` describe
        (oldSchema as GenericObjectType).prefixItems === undefined &&
        (newSchema as GenericObjectType).prefixItems === undefined &&
        (oldSchema.items === undefined || oldSchema.items === true));
    let oldSchemaItems = oldConstrainsNoItems ? ({} as S) : oldSchema.items;
    let newSchemaItems = newSchema.items;
    // Items described by a single schema are sanitized against it below. A tuple is kept only when both schemas
    // describe it alike, since its items are not sanitized position by position
    if (
      typeof oldSchemaItems === 'object' &&
      typeof newSchemaItems === 'object' &&
      !Array.isArray(oldSchemaItems) &&
      !Array.isArray(newSchemaItems) &&
      // An untyped old schema describes a tuple alike, below, rather than having the items new `prefixItems` describe
      // shifted by reading them against the new `items` alone
      !(oldIsUntyped && (newSchema as GenericObjectType).prefixItems !== undefined)
    ) {
      // Keep the raw (pre-resolution) items schema around: a conditional nested inside `items` must be
      // re-resolved per element below, against that element's own value, rather than the whole array (#5250)
      const oldSchemaItemsRaw = oldSchemaItems as S;
      const newSchemaItemsRaw = newSchemaItems as S;
      // Resolve refs, dependencies, if/then/else and allOf against the current array, not just a direct
      // `$ref`, so the type check below reflects an items schema whose object type is only reachable through
      // one of those keywords (#5250)
      const oldItemsSchema = retrieveSchema<unknown, S, F>(context, oldSchemaItemsRaw, rootSchema, data);
      oldSchemaItems = oldItemsSchema;
      // The old and new raw items schema are usually the same object, so skip resolving a second time in that common
      // case
      const sameRawItemsSchema = oldSchemaItemsRaw === newSchemaItemsRaw;
      const newItemsSchema = sameRawItemsSchema
        ? oldItemsSchema
        : retrieveSchema<unknown, S, F>(context, newSchemaItemsRaw, rootSchema, data);
      newSchemaItems = newItemsSchema;
      // Now get types and see if they are the same
      const oldSchemaType = getByPath(oldSchemaItems, 'type');
      const newSchemaType = getByPath(newSchemaItems, 'type');
      // Check if the old option has the same key with the same type
      if (!oldSchemaType || isSameType(oldSchemaType, newSchemaType)) {
        const maxItems = newSchema.maxItems ?? -1;
        // Items whose type list also allows `null` are read through `getSchemaType()`, as a property is above, so an
        // object one holds is sanitized as an object item is and a `null` it allows stays as it is
        const itemsType = newSchemaType === undefined ? undefined : getSchemaType<S>(newItemsSchema);
        // An item picked from object constants is one of them as a whole, so it's filtered against the options below
        // rather than sanitized property by property, which would find no properties and drop it
        if ((itemsType === 'object' || itemsType === 'array') && !isWholeValueSelect<S>(newItemsSchema)) {
          newFormData = data.reduce<unknown[]>((newValue, aValue: T) => {
            if (maxItems >= 0 && newValue.length >= maxItems) {
              return newValue;
            }
            const isContainerItem =
              itemsType === 'array' ? Array.isArray(aValue) : newSchemaType === 'object' || isPlainObject(aValue);
            // Resolve refs, dependencies, if/then/else and allOf against this item's own value, so a conditional
            // nested inside `items` picks the branch that matches this element rather than the whole array (#5250)
            const newItemSchema = retrieveSchema<T, S, F>(context, newSchemaItemsRaw, rootSchema, aValue);
            const listedValues = enumValuesForSchema<S>(newItemSchema);
            // A `null` that `nullable: true` allows stays as it is, as it does for a property, unless a new `const`
            // rejects it
            const isAllowedNull = aValue === null && newItemSchema.nullable === true;
            let itemValue: unknown = aValue;
            if (listedValues) {
              // An item its options list is one of them as a whole, so it is kept as it is, and one they don't list is
              // dropped, as a scalar item is, whatever the old schema listed
              itemValue = listedValues.some((value) => deepEquals(value, aValue)) ? aValue : undefined;
            } else if (isContainerItem && (itemsType === 'array' || newItemSchema[PROPERTIES_KEY])) {
              const oldItemSchema = sameRawItemsSchema
                ? newItemSchema
                : retrieveSchema<T, S, F>(context, oldSchemaItemsRaw, rootSchema, aValue);
              // `type: 'object'` items can't hold a value that is no object, whatever the old items allowed, so it is
              // dropped rather than given an empty object, a row the user never filled, unless it is the old `const`
              const isObjectless = itemsType === 'object' && aValue !== undefined && !isPlainObject(aValue);
              // An array element whose items the two sides describe differently is kept as it is: the shared array
              // rule clears it even where the new items accept it. One a new `const` rejects once sanitized takes it or
              // is dropped, rather than kept for the `undefined` the recursion clears it with
              let sanitizedItem: unknown = aValue;
              if (!isAllowedNull) {
                sanitizedItem = isObjectless
                  ? undefined
                  : (sanitizeDataForNewSchema<T, S, F>(context, rootSchema, newItemSchema, oldItemSchema, aValue) ??
                    aValue);
              }
              const replacement = constReplacement<S>(newItemSchema, oldItemSchema, sanitizedItem ?? aValue, aValue);
              itemValue = replacement === NO_VALUE ? sanitizedItem : replacement;
            } else if (isContainerItem) {
              // An object item declaring no `properties` has none to prune, so it is kept as it is
              itemValue = isPlainObject(aValue) || isAllowedNull ? aValue : undefined;
            }
            if (itemValue !== undefined) {
              newValue.push(itemValue);
            }
            return newValue;
          }, []);
        } else {
          // Filter out items that are no longer valid in the new items schema (e.g., enum values that changed)
          const newItemEnumValues = enumValuesForSchema(newItemsSchema);
          const filteredData = newItemEnumValues
            ? data.filter((item: unknown) => newItemEnumValues.some((v) => deepEquals(v, item)))
            : data;
          // `maxItems` of 0 allows no item at all, which is how the per-element path above reads it too
          newFormData =
            maxItems >= 0 && filteredData.length > maxItems ? filteredData.slice(0, maxItems) : filteredData;
        }
      }
    } else if (
      // `items: false`, or `additionalItems: false` beside a tuple `items`, allows only the items the tuple or
      // `prefixItems` describes, which an untyped old schema's data need not fit
      (oldIsUntyped &&
        newSchemaItems !== false &&
        !(Array.isArray(newSchemaItems) && (newSchema as GenericObjectType).additionalItems === false)) ||
      // `additionalItems` describes nothing beside an `items` that is not a tuple, so it only counts beside one
      (Array.isArray(oldSchemaItems) || Array.isArray(newSchemaItems) ? TUPLE_KEYWORDS : ITEMS_KEYWORDS).every((key) =>
        deepEquals((oldSchema as GenericObjectType)[key], (newSchema as GenericObjectType)[key]),
      )
    ) {
      // A tuple, a boolean `items`, or an array declaring no `items`, that both schemas describe alike holds what it
      // held, up to the new schema's `maxItems` as items described by a single schema are
      const { maxItems } = newSchema;
      newFormData = maxItems !== undefined && data.length > maxItems ? data.slice(0, maxItems) : data;
    }
  }
  // Checked once sanitized, since removing what only the old schema declared can leave the `const`. Data the new `const`
  // still rejects takes the new `const` where it holds the old one, as a scalar does above, and is otherwise cleared:
  // below the top level, nothing refills a clear
  const replacement =
    newSchema?.const !== undefined && isContainerValue(data)
      ? constReplacement<S>(newSchema, oldSchema, newFormData ?? data, data)
      : NO_VALUE;
  return (replacement === NO_VALUE ? newFormData : replacement) as T;
}
