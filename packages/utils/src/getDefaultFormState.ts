import { JSONSchema7 } from 'json-schema';

import isObject from './isObject';
import mergeDefaultsWithFormData from './mergeDefaultsWithFormData';

export default function getDefaultFormState<T = any>(
  _schema: JSONSchema7,
  formData: T,
  rootSchema: JSONSchema7 = {},
  includeUndefinedValues: boolean = false
) {
  if (!isObject(_schema)) {
    throw new Error("Invalid schema: " + _schema);
  }
  const schema = retrieveSchema(_schema, rootSchema, formData);
  const defaults = computeDefaults(
    schema,
    _schema.default,
    rootSchema,
    formData,
    includeUndefinedValues
  );
  if (typeof formData === "undefined" || formData === null) {
    // No form data? Use schema defaults.
    return defaults;
  }
  if (isObject(formData) || Array.isArray(formData)) {
    return mergeDefaultsWithFormData(defaults, formData);
  }
  return formData;
}
