import get from 'lodash/get';

import isObject from './isObject';
import { GenericObjectType, OverrideFormDataStrategy } from '../src';
import isNil from 'lodash/isNil';

/** Merges the `defaults` object of type `T` into the `formData` of type `T`
 *
 * When merging defaults and form data, we want to merge in this specific way:
 * - objects are deeply merged
 * - arrays are merged in such a way that:
 *   - when the array is set in form data, only array entries set in form data
 *     are deeply merged; additional entries from the defaults are ignored unless `mergeExtraArrayDefaults` is true, in
 *     which case the extras are appended onto the end of the form data
 *   - when the array is not set in form data, the default is copied over
 * - scalars are overwritten/set by form data unless undefined and there is a default AND `defaultSupercedesUndefined`
 *   is true
 *
 * @param [defaults] - The defaults to merge
 * @param [formData] - The form data into which the defaults will be merged
 * @param [mergeExtraArrayDefaults=false] - If true, any additional default array entries are appended onto the formData
 * @param [defaultSupercedesUndefined=false] - If true, an explicit undefined value will be overwritten by the default value
 * @param [overrideFormDataWithDefaultsStrategy=OverrideFormDataStrategy.noop] - Strategy for merging defaults and form data
 * @returns - The resulting merged form data with defaults
 */
export default function mergeDefaultsWithFormData<T = any>(
  defaults?: T,
  formData?: T,
  mergeExtraArrayDefaults = false,
  defaultSupercedesUndefined = false,
  overrideFormDataWithDefaultsStrategy: OverrideFormDataStrategy = OverrideFormDataStrategy.noop,
): T | undefined {
  if (Array.isArray(formData)) {
    const defaultsArray = Array.isArray(defaults) ? defaults : [];

    // If overrideFormDataWithDefaultsStrategy is not noop, we want to override the formData with the defaults
    const overrideArray =
      overrideFormDataWithDefaultsStrategy !== OverrideFormDataStrategy.noop ? defaultsArray : formData;
    const overrideOppositeArray =
      overrideFormDataWithDefaultsStrategy !== OverrideFormDataStrategy.noop ? formData : defaultsArray;

    const mapped = overrideArray.map((value, idx) => {
      // We want to explicitly make sure that the value is NOT undefined since null, 0 and empty space are valid values
      if (overrideOppositeArray[idx] !== undefined) {
        return mergeDefaultsWithFormData<any>(
          defaultsArray[idx],
          formData[idx],
          mergeExtraArrayDefaults,
          defaultSupercedesUndefined,
          overrideFormDataWithDefaultsStrategy,
        );
      }
      return value;
    });

    // Merge any extra defaults when mergeExtraArrayDefaults is true
    // Or when overrideFormDataWithDefaults is 'merge' and the default array is shorter than the formData array
    if (
      (mergeExtraArrayDefaults || overrideFormDataWithDefaultsStrategy === OverrideFormDataStrategy.merge) &&
      mapped.length < overrideOppositeArray.length
    ) {
      mapped.push(...overrideOppositeArray.slice(mapped.length));
    }
    return mapped as unknown as T;
  }
  if (isObject(formData)) {
    const iterationSource =
      overrideFormDataWithDefaultsStrategy === OverrideFormDataStrategy.replace ? (defaults ?? {}) : formData;
    const acc: { [key in keyof T]: any } = Object.assign({}, defaults); // Prevent mutation of source object.
    return Object.keys(iterationSource as GenericObjectType).reduce((acc, key) => {
      const keyValue = get(formData, key);
      const keyExistsInDefaults = isObject(defaults) && key in (defaults as GenericObjectType);
      const keyExistsInFormData = key in (formData as GenericObjectType);
      const keyDefault = get(defaults, key) ?? {};
      const defaultValueIsNestedObject = keyExistsInDefaults && Object.entries(keyDefault).some(([, v]) => isObject(v));

      const keyDefaultIsObject = keyExistsInDefaults && isObject(get(defaults, key));
      const keyHasFormDataObject = keyExistsInFormData && isObject(keyValue);

      if (
        keyDefaultIsObject &&
        keyHasFormDataObject &&
        !defaultValueIsNestedObject &&
        overrideFormDataWithDefaultsStrategy !== OverrideFormDataStrategy.replace
      ) {
        acc[key as keyof T] = { ...keyDefault, ...keyValue };
        return acc;
      }

      // overrideFormDataWithDefaultsStrategy can be 'merge' only when the key value exists in defaults
      // Or if the key value doesn't exist in formData
      const keyOverrideDefaultStrategy =
        overrideFormDataWithDefaultsStrategy === OverrideFormDataStrategy.replace
          ? OverrideFormDataStrategy.replace
          : keyExistsInDefaults || !keyExistsInFormData
            ? overrideFormDataWithDefaultsStrategy
            : OverrideFormDataStrategy.noop;

      acc[key as keyof T] = mergeDefaultsWithFormData<T>(
        keyDefault,
        keyValue,
        mergeExtraArrayDefaults,
        defaultSupercedesUndefined,
        keyOverrideDefaultStrategy,
      );
      return acc;
    }, acc);
  }

  /**
   * If the defaultSupercedesUndefined flag is true
   *    And formData is set to undefined or null and defaults are defined
   *    Or if formData is a number and is NaN return defaults
   * Or if overrideFormDataWithDefaults flag is true and formData is set to not undefined/null return defaults
   */
  if (
    (defaultSupercedesUndefined &&
      ((!isNil(defaults) && isNil(formData)) || (typeof formData === 'number' && isNaN(formData)))) ||
    (overrideFormDataWithDefaultsStrategy === OverrideFormDataStrategy.merge && !isNil(formData))
  ) {
    return defaults;
  }

  return overrideFormDataWithDefaultsStrategy === OverrideFormDataStrategy.replace ? defaults : formData;
}
