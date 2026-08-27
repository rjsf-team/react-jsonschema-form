/** Determines whether the given `formData` represents valid form data, such as a primitive type, an array, or a
 * non-empty object.
 *
 * @param formData - The data to check
 * @returns - True if `formData` is not undefined, null, a primitive type or an array or an empty object
 */
export default function isFormDataAvailable<T = any>(formData?: T): boolean {
  if (formData === undefined || formData === null) {
    return false;
  }
  if (typeof formData !== 'object' || Array.isArray(formData)) {
    return true;
  }
  return Object.keys(formData).length > 0;
}
