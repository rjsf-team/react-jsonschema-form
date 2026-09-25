import { CONST_KEY, DEFAULT_KEY, PROPERTIES_KEY } from '../constants.ts';
import deepEquals, { deepEqualsIgnoringUndefined } from '../deepEquals.ts';
import getPropertySchema from '../getPropertySchema.ts';
import isPlainObject from '../isPlainObject.ts';
import { getByPath, hasByPath } from '../pathUtils.ts';
import type {
  Experimental_CustomMergeAllOf,
  Experimental_DefaultFormStateBehavior,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from '../types.ts';
import getDefaultFormState from './getDefaultFormState.ts';
import retrieveSchema from './retrieveSchema.ts';

const NO_VALUE = Symbol('no Value');

/** Collects the values an `enum`, or a `oneOf`/`anyOf` of `const`-like options, restricts a value to. When
 * `requireEnumLikeOptions` is set, a `oneOf`/`anyOf` carrying even one option that isn't `const`-like yields nothing:
 * such an option allows values none of the collected ones spell out, so treating the collection as exhaustive would
 * reject data the schema accepts
 */
function enumValuesForSchema<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  requireEnumLikeOptions = false,
): any[] | undefined {
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

  if (requireEnumLikeOptions && values.length !== options.length) {
    return undefined;
  }

  return values.length > 0 ? values : undefined;
}

function replacementForInvalidEnumValue<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  formValue: any,
  requireEnumLikeOptions: boolean,
) {
  const enumValues = enumValuesForSchema(schema, requireEnumLikeOptions);
  if (!enumValues || enumValues.some((value) => deepEqualsIgnoringUndefined(value, formValue))) {
    return NO_VALUE;
  }

  const defaultValue = getByPath(schema, DEFAULT_KEY, NO_VALUE);
  if (defaultValue !== NO_VALUE && enumValues.some((value) => deepEqualsIgnoringUndefined(value, defaultValue))) {
    return defaultValue;
  }

  return enumValues.length === 1 ? enumValues[0] : undefined;
}

interface ConstraintCheckOptions {
  /** True when the key is absent from the old schema, so a default initializes it rather than replacing a value */
  isNewProperty?: boolean;
  /** True when the key holds a value at all, which is what makes an enum-like constraint worth checking */
  checkEnum?: boolean;
  /** True when a value the constraints leave alone is recursed into rather than kept as is — an object, or an array
   * holding array data. Only a constraint that genuinely changed replaces such a value outright, so that a `const`
   * or enum neither schema touched cannot clear or substitute data the recursive sanitize would have preserved. A
   * scalar gets no such gate, since a dependency can narrow its enum without the property's own schema changing
   * (#5250)
   */
  isStructural?: boolean;
  /** The value the form would hold for this key under `newSchema`, or `NO_VALUE` when it would hold nothing */
  newDefault?: any;
  /** The value the form would hold for this key under `oldSchema`, or `NO_VALUE` when it would hold nothing */
  oldDefault?: any;
}

/** Copies a structural replacement, which is either a schema's own `default`, `const` or enum value or one of the
 * memoized computations below, so that no two keys or array elements share it and a consumer mutating the form data
 * cannot reach back into a schema that other forms and renders are still using
 */
function unaliased(value: any) {
  return isPlainObject(value) || Array.isArray(value) ? structuredClone(value) : value;
}

/** Determines the value, if any, that should replace `formValue` outright because the default, `const` or enum-like
 * constraint the key carries differs between `oldSchema` and `newSchema`. Returns `NO_VALUE` when nothing about those
 * constraints makes the current value stale, leaving the caller free to keep or recursively sanitize it instead.
 */
function replacementForChangedConstraint<S extends StrictRJSFSchema = RJSFSchema>(
  newSchema: S,
  oldSchema: S,
  formValue: any,
  {
    isNewProperty = false,
    checkEnum = false,
    isStructural = false,
    newDefault = NO_VALUE,
    oldDefault = NO_VALUE,
  }: ConstraintCheckOptions,
) {
  let replacement: any = NO_VALUE;

  // A value the new schema would have produced anyway is current rather than stale, whoever put it there. Testing that
  // first is what keeps this function idempotent: running it again over its own output must not find the value it
  // just wrote stale and clear it
  if (newDefault !== NO_VALUE && !deepEqualsIgnoringUndefined(newDefault, formValue)) {
    const defaultChanged = !deepEquals(oldDefault, newDefault);
    // A key the new schema entered without spelling out a `default` of its own is left for `getDefaultFormState` to
    // populate, since anything derived from the children alone is what it would compute there anyway
    const initializesNewProperty =
      isNewProperty && formValue === undefined && getByPath(newSchema, DEFAULT_KEY, NO_VALUE) !== NO_VALUE;
    if (defaultChanged && (initializesNewProperty || deepEqualsIgnoringUndefined(oldDefault, formValue))) {
      // Initialize a newly entered property, or replace a value the old schema's default put there (#4476)
      replacement = newDefault;
    } else if (newSchema.readOnly === true && !isStructural && (defaultChanged || oldSchema.readOnly !== true)) {
      // A value in a field the user cannot edit belongs to whichever default currently governs it, so clearing it lets
      // that default take over. A value differing from a default neither schema touched came from the server instead,
      // and a structural value is recursed into so that the part of it the new schema still declares survives
      replacement = undefined;
    }
  }

  const newConst = getByPath(newSchema, CONST_KEY, NO_VALUE);
  const oldConst = getByPath(oldSchema, CONST_KEY, NO_VALUE);
  if (
    newConst !== NO_VALUE &&
    !(isStructural && deepEquals(oldConst, newConst)) &&
    !deepEqualsIgnoringUndefined(newConst, formValue)
  ) {
    // The new `const` is the only value the new schema accepts, so it is written wherever there is nothing to lose by
    // doing so: the old `const` put the value there, or the value is a structural one the recursive sanitize would
    // otherwise have kept in a shape the `const` forbids. A scalar holding something else is cleared instead, leaving
    // the key for `getDefaultFormState` to fill, which it cannot do for a structural one it finds explicitly undefined
    replacement = deepEqualsIgnoringUndefined(oldConst, formValue) || isStructural ? newConst : undefined;
  }

  if (
    checkEnum &&
    !(isStructural && deepEquals(enumValuesForSchema(oldSchema, true), enumValuesForSchema(newSchema, true)))
  ) {
    const enumReplacement = replacementForInvalidEnumValue(newSchema, formValue, isStructural);
    if (enumReplacement !== NO_VALUE) {
      replacement = enumReplacement;
    }
  }

  return unaliased(replacement);
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
 *       - Whatever the type, check the default, `const` and enum-like constraints for a value that replaces the
 *         form value outright, so that two schemas differing only by those values are properly selected:
 *         - Get the value the form would hold for the key under each schema, which is that schema's computed default
 *           for the key, or its literal `default` keyword when the computation produces nothing, and check:
 *           - If the new default does not match the form value and the two defaults differ:
 *             - If the key is new and its form value is undefined, or the old default matches the form value, then:
 *               - The replacement is the new default
 *               - Otherwise, if the new schema is a `readOnly` scalar, the replacement is undefined, as it also is
 *                 when an unchanged default sits on a scalar the new schema newly marks `readOnly`
 *         - Get the old and new `const` values from the schema and check:
 *           - If the new `const` value does not match the form value:
 *             - If the old `const` value matches the form value, or the value is an object or array, the replacement
 *               is the new `const`
 *             - Otherwise, the replacement is undefined
 *         - If the form value is no longer one of the values the new schema's `enum`, `oneOf` or `anyOf` allows, the
 *           replacement is the new `default` when that is allowed, the sole allowed value, or undefined
 *         - The `const` and enum-like checks are skipped for an object or array value whose constraint is identical
 *           in both schemas, since such a value is recursed into rather than replaced, and the enum-like check is
 *           skipped entirely for one whose `oneOf`/`anyOf` carries an option that is not `const`-like
 *       - If there is a replacement, store it in `removeOldSchemaData[key]`
 *       - Otherwise, if type of the key in the new schema is `object` (or `array` with array data):
 *         - Store the value from the recursive `sanitizeDataForNewSchema` call in `nestedData[key]`
 *   - Once all keys have been processed, return an object built as follows:
 *     - `{ ...data, ...removeOldSchemaData, ...nestedData }`
 * - If the new and old schema types are array and the `data` is an array then:
 *   - If the type of the old and new schema `items` are a non-array objects:
 *     - Retrieve the schema for any refs within each `oldKeySchema.items` and/or `newKeySchema.items`
 *     - If the `type`s of both items are the same (or the old does not have a type):
 *       - Check each element against the item schemas for a replacement the same way a key is checked above, so that
 *         a default on `items` that changed no longer leaves the elements it produced behind
 *       - If the type is "object", then:
 *         - For each element in the `data` recursively sanitize the data, stopping at `maxItems` if specified
 *       - Otherwise, drop the elements the new `items` schema no longer allows and any values after `maxItems`
 *   - If the type of the old and new schema `items` are booleans of the same value, return `data` as is
 * - Otherwise return `undefined`
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param rootSchema - The root JSON schema of the entire form
 * @param [newSchema] - The new schema for which the data is being sanitized
 * @param [oldSchema] - The old schema from which the data originated
 * @param [data={}] - The form data associated with the schema, defaulting to an empty object when undefined
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @param [experimental_defaultFormStateBehavior] - Optional configuration controlling how defaults are computed, used
 *      when comparing an object or array value against the default the old schema would have produced for it
 * @returns - The new form data, with all the fields uniquely associated with the old schema set
 *      to `undefined`. Will return `undefined` if the new schema is not an object containing properties.
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
  data: any = {},
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
  experimental_defaultFormStateBehavior?: Experimental_DefaultFormStateBehavior,
): T {
  // What the form holds for a key is the default `getDefaultFormState` computes for the whole object: it merges each
  // child's own default into the parent's and emits only the keys the schema declares. Deriving both the staleness
  // test and the replacement from that one computation is what makes this function's output match the form's own, and
  // therefore stable when it runs again over that output (#4476). The result is memoized because a level asks for the
  // same two schemas once per key, and an array for the same item schema once per element
  const computedDefaults = new WeakMap<S>();
  const defaultsFor = (schema: S) => {
    if (!computedDefaults.has(schema)) {
      computedDefaults.set(
        schema,
        getDefaultFormState<T, S, F>(
          validator,
          schema,
          undefined,
          rootSchema,
          false,
          experimental_defaultFormStateBehavior,
          experimental_customMergeAllOf,
        ),
      );
    }
    return computedDefaults.get(schema);
  };
  /** The value the form would hold for `key` of `containerSchema`, falling back to the literal `default` keyword when
   * the computation produces nothing for it, as it does for an object spelling one out without declaring properties
   */
  const defaultForKey = (containerSchema: S | undefined, keyedSchema: S, key: string) => {
    const computed = containerSchema ? defaultsFor(containerSchema) : undefined;
    return isPlainObject(computed) && computed[key] !== undefined
      ? computed[key]
      : getByPath(keyedSchema, DEFAULT_KEY, NO_VALUE);
  };
  /** The value the form would hold for an element of an array, which `ArrayField` builds with the item schema as its
   * own root rather than as a key of the array
   */
  const defaultForItem = (itemSchema: S) => {
    const computed = defaultsFor(itemSchema);
    return computed !== undefined ? computed : getByPath(itemSchema, DEFAULT_KEY, NO_VALUE);
  };

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
    // A key's default is drawn from the object around it as much as from its own schema, so a `default` this object
    // spells out for a key it declares identically in both schemas changed that key's default all the same
    const containerDefaultChanged = !deepEquals(
      getByPath(oldSchema, DEFAULT_KEY, NO_VALUE),
      getByPath(newSchema, DEFAULT_KEY, NO_VALUE),
    );
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
        // A `default`, `const` or enum-like constraint that changed between the two schemas makes the current value
        // stale whatever its type: an object or array still holding the old schema's default is as stale as a scalar
        // one, so it is replaced outright rather than recursed into (#4476)
        const isStructural =
          newSchemaTypeForKey === 'object' || (newSchemaTypeForKey === 'array' && Array.isArray(formValue));
        // Nothing a key's default is drawn from can have changed when this object declares the key identically in
        // both schemas and spells out the same `default` for it, so neither default-driven replacement can fire.
        // Skipping them leaves the whole level's defaults uncomputed for a schema change that touched none of its
        // keys, which is the common case for the sanitize `Form` runs on every retrieved schema change
        const hasChangedDefault = containerDefaultChanged || oldKeyedSchema !== newKeyedSchema;
        const replacement = replacementForChangedConstraint<S>(newKeyedSchema, oldKeyedSchema, formValue, {
          isNewProperty,
          checkEnum: hasByPath(data, key),
          isStructural,
          newDefault: hasChangedDefault ? defaultForKey(newSchema, newKeyedSchema, key) : NO_VALUE,
          oldDefault: hasChangedDefault ? defaultForKey(oldSchema, oldKeyedSchema, key) : NO_VALUE,
        });
        if (replacement !== NO_VALUE) {
          removeOldSchemaData[key] = replacement;
        } else if (isStructural) {
          // SIDE-EFFECT: process the new schema type of object recursively to save iterations
          const itemData = sanitizeDataForNewSchema<T, S, F>(
            validator,
            rootSchema,
            newKeyedSchema,
            isNewProperty && newSchemaTypeForKey === 'array' ? newKeyedSchema : oldKeyedSchema,
            formValue,
            experimental_customMergeAllOf,
            experimental_defaultFormStateBehavior,
          );
          if (itemData !== undefined || newSchemaTypeForKey === 'array') {
            // only put undefined values for the array type and not the object type
            nestedData[key] = itemData;
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
            // A default on `items` goes stale exactly as one on the array property does, so each element is
            // checked against the item schemas before being recursed into (#4476). The enum check is skipped: an
            // element the new schema disallows is kept rather than replaced, so running it here would substitute the
            // sole allowed value and fabricate a duplicate. Identical item schemas declare identical defaults, and
            // skipping the computation for them matters most here, where a conditional inside `items` resolves to a
            // schema of its own for every element and so defeats the memoization
            const hasChangedItemDefault = oldItemSchema !== newItemSchema;
            const itemReplacement = replacementForChangedConstraint<S>(newItemSchema, oldItemSchema, aValue, {
              isStructural: true,
              newDefault: hasChangedItemDefault ? defaultForItem(newItemSchema) : NO_VALUE,
              oldDefault: hasChangedItemDefault ? defaultForItem(oldItemSchema) : NO_VALUE,
            });
            // A cleared element would be dropped from the array rather than emptied, shrinking it silently, so only
            // a real replacement is taken here and anything else is left to the recursion
            const itemValue =
              itemReplacement !== NO_VALUE && itemReplacement !== undefined
                ? itemReplacement
                : sanitizeDataForNewSchema<T, S, F>(
                    validator,
                    rootSchema,
                    newItemSchema,
                    oldItemSchema,
                    aValue,
                    experimental_customMergeAllOf,
                    experimental_defaultFormStateBehavior,
                  );
            if (itemValue !== undefined && (maxItems < 0 || newValue.length < maxItems)) {
              newValue.push(itemValue);
            }
            return newValue;
          }, []);
        } else {
          // A default on scalar `items` goes stale the same way one on object `items` does, so each element gets the
          // same check. A replacement of `undefined` is not taken, since it would leave a hole in the array rather
          // than clear the element
          const hasChangedItemDefault = oldSchemaItems !== newSchemaItems;
          const newItemDefault = hasChangedItemDefault ? defaultForItem(newSchemaItems as S) : NO_VALUE;
          const oldItemDefault = hasChangedItemDefault ? defaultForItem(oldSchemaItems as S) : NO_VALUE;
          const refreshedData = data.map((item: any) => {
            const itemReplacement = replacementForChangedConstraint<S>(newSchemaItems as S, oldSchemaItems as S, item, {
              newDefault: newItemDefault,
              oldDefault: oldItemDefault,
            });
            return itemReplacement !== NO_VALUE && itemReplacement !== undefined ? itemReplacement : item;
          });
          // Filter out items that are no longer valid in the new items schema (e.g., enum values that changed)
          const newItemEnumValues = enumValuesForSchema(newSchemaItems as S);
          const filteredData = newItemEnumValues
            ? refreshedData.filter((item: any) => newItemEnumValues.some((v: any) => deepEquals(v, item)))
            : refreshedData;
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
  return newFormData as T;
}
