/** Checks whether `value` is an object or an array, which `String()` spells `[object Object]` or joins into a list, so
 * an enum value that is one can't be told apart from another by its string
 *
 * @param value - The value to check
 * @returns - True if `value` is an object or array, other than `null`
 */
export default function isContainerValue(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
