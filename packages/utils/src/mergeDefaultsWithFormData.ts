import get from 'lodash/get';

import isObject from './isObject';
import { GenericObjectType } from '../src';

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
 * @returns - The resulting merged form data with defaults
 */
export default function mergeDefaultsWithFormData<T = any>(
  defaults?: T,
  formData?: T,
  mergeExtraArrayDefaults = false,
  defaultSupercedesUndefined = false
): T | undefined {
  if (Array.isArray(formData)) {
    const defaultsArray = Array.isArray(defaults) ? defaults : [];
    const mapped = formData.map((value, idx) => {
      if (defaultsArray[idx]) {
        return mergeDefaultsWithFormData<any>(
          defaultsArray[idx],
          value,
          mergeExtraArrayDefaults,
          defaultSupercedesUndefined
        );
      }
      return value;
    });
    // Merge any extra defaults when mergeExtraArrayDefaults is true
    if (mergeExtraArrayDefaults && mapped.length < defaultsArray.length) {
      mapped.push(...defaultsArray.slice(mapped.length));
    }
    return mapped as unknown as T;
  }
  if (isObject(formData)) {
    const acc: { [key in keyof T]: any } = Object.assign({}, defaults); // Prevent mutation of source object.
    return Object.keys(formData as GenericObjectType).reduce((acc, key) => {
      acc[key as keyof T] = mergeDefaultsWithFormData<T>(
        defaults ? get(defaults, key) : {},
        get(formData, key),
        mergeExtraArrayDefaults,
        defaultSupercedesUndefined
      );
      return acc;
    }, acc);
  }
  if (defaultSupercedesUndefined && formData === undefined) {
    return defaults;
  }
  return formData;
}
