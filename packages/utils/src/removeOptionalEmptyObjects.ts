import isObject from './isObject';
import { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, ValidatorType } from './types';
import retrieveSchema from './schema/retrieveSchema';
import isNil from 'lodash/isNil';

/** Determines whether a value is considered "empty" for the purposes of optional object pruning.
 * A value is empty if it is `undefined`, `null`, an empty string, or an object where all own
 * properties are themselves empty.
 *
 * @param value - The value to check
 * @returns True if the value is considered empty
 */
function isValueEmpty(value: unknown): boolean {
  if (isNil(value) || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    // An empty array is considered empty; a non-empty array is not
    return value.length === 0;
  }
  if (isObject(value)) {
    const obj = value as GenericObjectType;
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return true;
    }
    return keys.every((key) => isValueEmpty(obj[key]));
  }
  return false;
}

/** Recursively removes optional objects from the `formData` that are empty (i.e., all their fields
 * are undefined, null, empty strings, or themselves empty optional objects). This solves the problem
 * where interacting with fields inside an optional object "activates" it permanently, making the
 * form unsubmittable when the optional object has required inner fields.
 *
 * An object property is considered "optional" when it is NOT listed in its parent schema's `required`
 * array.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The JSON schema describing the `formData`
 * @param [rootSchema] - The root schema, used primarily to look up `$ref`s
 * @param [formData] - The current form data to prune
 * @returns - A new copy of `formData` with empty optional objects removed, or `undefined` if the
 *           entire formData was pruned
 */
export default function removeOptionalEmptyObjects<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(validator: ValidatorType<T, S, F>, schema: S, rootSchema?: S, formData?: T): T | undefined {
  if (!isObject(schema)) {
    return formData;
  }

  const resolvedSchema = retrieveSchema<T, S, F>(validator, schema, rootSchema, formData);

  if (Array.isArray(formData)) {
    const itemsSchema = resolvedSchema.items as S | S[];
    if (!itemsSchema) {
      return formData;
    }

    let hasChanges = false;
    const mapped = formData.map((item, index) => {
      let itemSchema = itemsSchema as S;
      if (Array.isArray(itemsSchema)) {
        itemSchema = itemsSchema[index] || (resolvedSchema.additionalItems as S) || ({} as S);
      }
      const cleaned = removeOptionalEmptyObjects<T, S, F>(validator, itemSchema, rootSchema, item);
      if (cleaned !== item) {
        hasChanges = true;
      }
      return cleaned === undefined ? ({} as T) : cleaned;
    });

    return hasChanges ? (mapped as unknown as T) : formData;
  }

  if (!isObject(formData)) {
    return formData;
  }

  const { properties, required: requiredFields = [] } = resolvedSchema;

  if (!properties) {
    return formData;
  }

  const result: GenericObjectType = {};
  const data = formData as GenericObjectType;
  let hasAnyValue = false;

  for (const key of Object.keys(data)) {
    const value = data[key];
    const propertySchema = (properties[key] || {}) as S;
    const isRequired = (requiredFields as string[]).includes(key);

    const isObj = isObject(value);
    const isArr = Array.isArray(value);

    if ((isObj || isArr) && properties[key]) {
      // Recursively process nested objects and arrays
      const cleaned = removeOptionalEmptyObjects<T, S, F>(validator, propertySchema, rootSchema, value as T);

      if (!isRequired && isValueEmpty(cleaned)) {
        // This is an optional property and the cleaned result is empty — omit it
        continue;
      }

      result[key] = cleaned;
      hasAnyValue = true;
    } else if (!isRequired && isValueEmpty(value) && properties[key]) {
      // Optional scalar property that is empty — omit it
      continue;
    } else {
      result[key] = value;
      if (!isValueEmpty(value)) {
        hasAnyValue = true;
      }
    }
  }

  // If the entire object ended up empty after pruning, return undefined so that the
  // caller (which may itself be a recursive call) can decide whether to keep or drop it
  if (!hasAnyValue && Object.keys(result).length === 0) {
    return undefined;
  }

  return result as T;
}
