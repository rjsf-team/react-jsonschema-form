/** Turns a widget's `value`, which can hold anything, into what an input's `value` prop accepts. A string or a number
 * is kept, so a numeric input stays numeric, a boolean, a bigint or a `Date` is stringified and an array's items are
 * each turned this way and joined with commas the way React renders them, so a hidden multi-select still submits its
 * items, and anything else, `undefined`, `null` and `NaN` included, becomes an empty string
 *
 * @param value - The widget's value
 * @returns - The value for an input's `value` prop
 */
export default function toInputValue(value: unknown): string | number {
  if (typeof value === 'string' || (typeof value === 'number' && !Number.isNaN(value))) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toInputValue(item)).join(',');
  }
  return typeof value === 'boolean' || typeof value === 'bigint' || value instanceof Date ? String(value) : '';
}
