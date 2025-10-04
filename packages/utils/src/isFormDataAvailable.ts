import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';

/** Determines whether the given `formData` represents valid form data, such as a primitive type, or a non-empty object
 * or array.
 *
 * @param formData - The data to check
 * @returns - true if `formData` is not undefined, null, a primitive type or an empty object/array
 */
export default function isFormDataAvailable<T = any>(formData?: T) {
  return !isNil(formData) && (!isObject(formData) || Array.isArray(formData) || !isEmpty(formData));
}
