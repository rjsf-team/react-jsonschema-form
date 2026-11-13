/** Determines whether the given `formData` holds a value, which is anything but `undefined` or `null`. An empty object
 * or array is a value: it is what an Optional Data Control's Add stores, so it reads as opted in.
 *
 * @param formData - The data to check
 * @returns - True if `formData` is neither `undefined` nor `null`
 */
export default function isFormDataAvailable<T = unknown>(formData?: T): boolean {
  return formData !== undefined && formData !== null;
}
