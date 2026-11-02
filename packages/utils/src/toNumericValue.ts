/** Reads a widget's `value`, which can hold anything, as a number, for a widget that draws one such as a slider or a
 * rating. A finite number is kept and a numeric string, which JSON data can hold where a number is meant, counts as its
 * number. Anything else, `''`, `false` and `[]` included, which `Number()` alone would read as 0, is no number
 *
 * @param value - The widget's value
 * @returns - The number `value` holds, or `undefined` if it holds none
 */
export default function toNumericValue(value: unknown): number | undefined {
  const numeric = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : undefined;
}
