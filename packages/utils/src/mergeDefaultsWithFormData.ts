import get from 'lodash/get';
import map from 'lodash/map';

import isObject from './isObject';
/**
 * When merging defaults and form data, we want to merge in this specific way:
 * - objects are deeply merged
 * - arrays are merged in such a way that:
 *   - when the array is set in form data, only array entries set in form data
 *     are deeply merged; additional entries from the defaults are ignored
 *   - when the array is not set in form data, the default is copied over
 * - scalars are overwritten/set by form data
 */
export default function mergeDefaultsWithFormData<T = any>(defaults: T, formData: T): T {
  if (Array.isArray(formData)) {
    const defaultsArray = Array.isArray(defaults) ? defaults : [];
    const mapped = map(formData, (value, idx) => {
      if (defaultsArray[idx]) {
        return mergeDefaultsWithFormData<any>(defaultsArray[idx], value);
      }
      return value;
    });
    return mapped as unknown as T;
  }
  if (isObject(formData)) {
    const acc: { [key in keyof T]: any } = Object.assign({}, defaults); // Prevent mutation of source object.
    return Object.keys(formData).reduce((acc, key) => {
      acc[key as keyof T] = mergeDefaultsWithFormData<T>(defaults ? get(defaults, key) : {}, get(formData, key));
      return acc;
    }, acc);
  }
  return formData;
}
