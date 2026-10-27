/** Turns a widget's `value`, which can hold anything, into what an input's `value` prop accepts. A string or a number
 * is kept, so a numeric input stays numeric, a boolean or a bigint is stringified the way React renders it, and anything
 * else, `undefined` and `null` included, becomes an empty string
 *
 * @param value - The widget's value
 * @returns - The value for an input's `value` prop
 */
export default function toInputValue(value: unknown): string | number {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return typeof value === 'boolean' || typeof value === 'bigint' ? String(value) : '';
}
