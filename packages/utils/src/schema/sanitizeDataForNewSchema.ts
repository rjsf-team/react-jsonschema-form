import { CONST_KEY, DEFAULT_KEY, PROPERTIES_KEY } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
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

/** Strips `undefined`-valued keys so a value still matching its schema isn't treated as stale. `deepEquals` counts
 * such a key as a difference, and this function writes them itself when it clears data, so `{ a: 1, b: undefined }`
 * would otherwise compare unequal to the `{ a: 1 }` that a `default` or `const` spells out.
 */
function stripUndefinedValues(value: any): any {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedValues);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.entries(value).reduce((acc: GenericObjectType, [key, entry]) => {
    if (entry !== undefined) {
      acc[key] = stripUndefinedValues(entry);
    }
    return acc;
  }, {});
}

/** Compares `a` and `b` for deep equality, disregarding any `undefined`-valued keys either one carries. */
function sameIgnoringUndefined(a: any, b: any) {
  return deepEquals(a, b) || deepEquals(stripUndefinedValues(a), stripUndefinedValues(b));
}

function replacementForInvalidEnumValue<S extends StrictRJSFSchema = RJSFSchema>(schema: S, formValue: any) {
  const enumValues = enumValuesForSchema(schema);
  if (!enumValues || enumValues.some((value) => sameIgnoringUndefined(value, formValue))) {
    return NO_VALUE;
  }

  const defaultValue = getByPath(schema, DEFAULT_KEY, NO_VALUE);
  if (defaultValue !== NO_VALUE && enumValues.some((value) => sameIgnoringUndefined(value, defaultValue))) {
    return defaultValue;
  }

  return enumValues.length === 1 ? enumValues[0] : undefined;
}

interface ConstraintCheckOptions<S extends StrictRJSFSchema = RJSFSchema> {
  /** True when the key is absent from the old schema, so a `default` initializes it rather than replacing a value */
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
  /** Computes what the form would actually hold for a schema, used to recognize and build structural defaults */
  computeDefault?: (schema: S) => any;
}

/** Determines the value, if any, that should replace `formValue` outright because the `default`, `const` or enum-like
 * constraint the key carries differs between `oldSchema` and `newSchema`. Returns `NO_VALUE` when nothing about those
 * constraints makes the current value stale, leaving the caller free to keep or recursively sanitize it instead.
 */
function replacementForChangedConstraint<S extends StrictRJSFSchema = RJSFSchema>(
  newSchema: S,
  oldSchema: S,
  formValue: any,
  { isNewProperty = false, checkEnum = false, isStructural = false, computeDefault }: ConstraintCheckOptions<S>,
) {
  let replacement: any = NO_VALUE;

  const newDefault = getByPath<any>(newSchema, DEFAULT_KEY, NO_VALUE);
  const oldDefault = getByPath(oldSchema, DEFAULT_KEY, NO_VALUE);
  // Both replacements require the two defaults to genuinely differ. The swap below could not fire without that
  // anyway, but the `readOnly` clear could, and a value differing from a `default` neither schema touched is what a
  // server or the user put in the field rather than a default gone stale
  if (newDefault !== NO_VALUE && !deepEquals(oldDefault, newDefault) && !sameIgnoringUndefined(newDefault, formValue)) {
    // What the form holds for an object or array is the *computed* default, since `getDefaultFormState` merges each
    // child's own default into the parent's, so the literal `default` keyword alone rarely matches it (#4476). That
    // walk is only worth taking once the cheaper comparisons have failed to explain the value
    const isStaleDefault =
      (isNewProperty && formValue === undefined) ||
      sameIgnoringUndefined(oldDefault, formValue) ||
      (computeDefault !== undefined && sameIgnoringUndefined(computeDefault(oldSchema), formValue));
    if (isStaleDefault) {
      // Initialize a newly entered property or replace an old default with the new default. The computed default
      // supplements rather than supplants the declared one: it contributes the children's own defaults, but
      // `getDefaultFormState` emits only the keys the schema declares, so on its own it would drop whatever the
      // `default` spells out beyond them — everything, for an object with no `properties` at all
      const newComputed = computeDefault?.(newSchema);
      replacement =
        isPlainObject(newDefault) && isPlainObject(newComputed) ? { ...newDefault, ...newComputed } : newDefault;
    } else if (newSchema.readOnly === true) {
      // If the new schema has the default set to read-only, treat it like a const and remove the value
      replacement = undefined;
    }
  }

  const newConst = getByPath(newSchema, CONST_KEY, NO_VALUE);
  const oldConst = getByPath(oldSchema, CONST_KEY, NO_VALUE);
  if (
    newConst !== NO_VALUE &&
    !(isStructural && deepEquals(oldConst, newConst)) &&
    !sameIgnoringUndefined(newConst, formValue)
  ) {
    // Since this is a const, if the old value matches, replace the value with the new const otherwise clear it
    replacement = sameIgnoringUndefined(oldConst, formValue) ? newConst : undefined;
  }

  if (checkEnum && !(isStructural && deepEquals(enumValuesForSchema(oldSchema), enumValuesForSchema(newSchema)))) {
    const enumReplacement = replacementForInvalidEnumValue(newSchema, formValue);
    if (enumReplacement !== NO_VALUE) {
      replacement = enumReplacement;
    }
  }

  return replacement;
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
 *       - Whatever the type, check the `default`, `const` and enum-like constraints for a value that replaces the
 *         form value outright, so that two schemas differing only by those values are properly selected:
 *         - Get the old and new `default` values from the schema and check:
 *           - If the new `default` value does not match the form value:
 *             - If the key is new and its form value is undefined, or the old `default` matches the form value, then:
 *               - The replacement is the new `default`
 *               - Otherwise, if the new schema is `readOnly` then the replacement is undefined
 *         - Get the old and new `const` values from the schema and check:
 *           - If the new `const` value does not match the form value:
 *           - If the old `const` value DOES match the form value, then:
 *             - The replacement is the new `const`
 *             - Otherwise, the replacement is undefined
 *         - If the form value is no longer one of the values the new schema's `enum`, `oneOf` or `anyOf` allows, the
 *           replacement is the new `default` when that is allowed, the sole allowed value, or undefined
 *         - The `const` and enum-like checks are skipped for an object or array value whose constraint is identical
 *           in both schemas, since such a value is recursed into rather than replaced
 *       - If there is a replacement, store it in `removeOldSchemaData[key]`
 *       - Otherwise, if type of the key in the new schema is `object` (or `array` with array data):
 *         - Store the value from the recursive `sanitizeDataForNewSchema` call in `nestedData[key]`
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
        // A `default`, `const` or enum-like constraint that changed between the two schemas makes the current value
        // stale whatever its type: an object or array still holding the old schema's default is as stale as a scalar
        // one, so it is replaced outright rather than recursed into (#4476)
        const isStructural =
          newSchemaTypeForKey === 'object' || (newSchemaTypeForKey === 'array' && Array.isArray(formValue));
        const replacement = replacementForChangedConstraint<S>(newKeyedSchema, oldKeyedSchema, formValue, {
          isNewProperty,
          checkEnum: hasByPath(data, key),
          isStructural,
          computeDefault: isStructural
            ? (schema: S) =>
                getDefaultFormState<T, S, F>(
                  validator,
                  schema,
                  undefined,
                  rootSchema,
                  false,
                  experimental_defaultFormStateBehavior,
                  experimental_customMergeAllOf,
                )
            : undefined,
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
            // A `default` on `items` goes stale exactly as one on the array property does, so each element is
            // checked against the item schemas before being recursed into (#4476). The enum check is skipped: an
            // element the new schema disallows is dropped by the filtering below rather than replaced, so running it
            // here would substitute the sole allowed value and fabricate a duplicate
            const itemReplacement = replacementForChangedConstraint<S>(newItemSchema, oldItemSchema, aValue, {
              isStructural: true,
              computeDefault: (schema: S) =>
                getDefaultFormState<T, S, F>(
                  validator,
                  schema,
                  undefined,
                  rootSchema,
                  false,
                  experimental_defaultFormStateBehavior,
                  experimental_customMergeAllOf,
                ),
            });
            // A cleared element would be dropped from the array rather than emptied, shrinking it silently, so only
            // a real replacement is taken here and anything else falls through to the recursion as before
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
  return newFormData as T;
}
