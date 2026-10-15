import type { GenericObjectType } from './index.ts';
import isObject from './isObject.ts';
import setOwn from './setOwn.ts';

/** Merges the `defaults` object of type `T` into the `formData` of type `T`
 *
 * When merging defaults and form data, we want to merge in this specific way:
 * - objects are deeply merged
 * - arrays are merged in such a way that:
 *   - when the array is set in form data, only array entries set in form data
 *     are deeply merged; additional entries from the defaults are ignored unless `mergeExtraArrayDefaults` is true, in
 *     which case the extras are appended onto the end of the form data
 *   - when the array is not set in form data, the default is copied over
 * - scalars are overwritten/set by form data unless the form data is `undefined` or `null` and there is a default, or
 *   is `NaN`, AND `defaultSupercedesUndefined` is true, or unless `overrideFormDataWithDefaults` is true and the form
 *   data is neither `undefined` nor `null`, in which case the default replaces it
 * - a non-object default is ignored when form data is an object, whatever the flags, so
 *   `mergeDefaultsWithFormData('x', { b: 2 })` returns `{ b: 2 }`
 *
 * @param [defaults] - The defaults to merge
 * @param [formData] - The form data into which the defaults will be merged
 * @param [mergeExtraArrayDefaults=false] - If true, any additional default array entries are appended onto the formData
 * @param [defaultSupercedesUndefined=false] - If true, an `undefined` or `null` form data value with a default, or a
 *        `NaN` one, will be overwritten by the default value
 * @param [overrideFormDataWithDefaults=false] - If true, the default value will overwrite the form data value, except
 *        that an `undefined` or `null` form data value is kept unless `defaultSupercedesUndefined` is true, a form data
 *        key or array entry that doesn't exist in the defaults keeps its value, and object or array form data is never
 *        replaced, only merged with a default of the same kind. A default that is present but `undefined` still
 *        replaces a scalar form data value. This is useful when we have already merged formData with defaults and want
 *        to add an additional field from formData that does not exist in defaults.
 * @returns - The resulting merged form data with defaults
 */
export default function mergeDefaultsWithFormData<T = unknown>(
  defaults?: T,
  formData?: T,
  mergeExtraArrayDefaults = false,
  defaultSupercedesUndefined = false,
  overrideFormDataWithDefaults = false,
): T | undefined {
  if (Array.isArray(formData)) {
    const formDataArray: unknown[] = formData;
    const defaultsArray: unknown[] = Array.isArray(defaults) ? defaults : [];

    // If overrideFormDataWithDefaults is true, we want to override the formData with the defaults
    const overrideArray = overrideFormDataWithDefaults ? defaultsArray : formDataArray;
    const overrideOppositeArray = overrideFormDataWithDefaults ? formDataArray : defaultsArray;

    const mapped = overrideArray.map((value, idx) => {
      // We want to explicitly make sure that the value is NOT undefined since null, 0 and empty space are valid values
      if (overrideOppositeArray[idx] !== undefined) {
        return mergeDefaultsWithFormData(
          defaultsArray[idx],
          formDataArray[idx],
          mergeExtraArrayDefaults,
          defaultSupercedesUndefined,
          overrideFormDataWithDefaults,
        );
      }
      return value;
    });

    // Merge any extra defaults when mergeExtraArrayDefaults is true
    // Or when overrideFormDataWithDefaults is true and the default array is shorter than the formData array
    if ((mergeExtraArrayDefaults || overrideFormDataWithDefaults) && mapped.length < overrideOppositeArray.length) {
      mapped.push(...overrideOppositeArray.slice(mapped.length));
    }
    return mapped as unknown as T;
  }
  if (isObject(formData)) {
    const formDataObj: GenericObjectType = formData;
    const defaultsObj: GenericObjectType | undefined = isObject(defaults) ? defaults : undefined;
    const acc: GenericObjectType = { ...defaultsObj }; // Prevent mutation of source object.
    return Object.keys(formDataObj).reduce((accumulator, key) => {
      const keyValue = formDataObj[key];
      const keyExistsInDefaults = defaultsObj !== undefined && Object.hasOwn(defaultsObj, key);
      const ownDefault = keyExistsInDefaults ? defaultsObj[key] : undefined;
      const keyDefault = ownDefault ?? {};
      // If any direct child of this key's default is itself an object or array,
      // the shallow spread below would bypass its merge rules. Route those cases
      // to the recursive path; the recursive call repeats this check one level deeper.
      const defaultValueNeedsDeepMerge =
        keyExistsInDefaults &&
        isObject(keyDefault) &&
        Object.values(keyDefault).some((v) => isObject(v) || Array.isArray(v));

      const keyDefaultIsObject = keyExistsInDefaults && isObject(ownDefault);
      const keyHasFormDataObject = isObject(keyValue);

      const merged =
        keyDefaultIsObject && keyHasFormDataObject && !defaultValueNeedsDeepMerge
          ? { ...ownDefault, ...keyValue }
          : mergeDefaultsWithFormData<T>(
              ownDefault,
              keyValue,
              mergeExtraArrayDefaults,
              defaultSupercedesUndefined,
              // overrideFormDataWithDefaults can be true only when the key value exists in defaults
              overrideFormDataWithDefaults && keyExistsInDefaults,
            );
      setOwn(accumulator, key, merged);
      return accumulator;
    }, acc) as T;
  }

  /**
   * If the defaultSupercedesUndefined flag is true
   *    And formData is set to undefined or null and defaults are defined
   *    Or if formData is a number and is NaN return defaults
   * Or if overrideFormDataWithDefaults flag is true and formData is set to not undefined/null return defaults
   */
  if (
    (defaultSupercedesUndefined &&
      ((!(defaults === undefined) && formData == null) || (typeof formData === 'number' && Number.isNaN(formData)))) ||
    (overrideFormDataWithDefaults && formData != null)
  ) {
    return defaults;
  }

  return formData;
}
