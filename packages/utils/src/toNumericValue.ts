const DECIMAL = /^\s*[+-]?(\d+(\.\d*)?|\.\d+)\s*$/;

/** Reads a widget's `value`, which can hold anything, as a number, for a widget that draws one such as a slider or a
 * rating. A finite number is kept and a plain decimal string, which JSON data can hold where a number is meant, counts
 * as its number. Anything else is no number: `''`, `false` and `[]`, which `Number()` alone would read as 0, and the
 * hex, binary, octal, exponent and `Infinity` strings it would also read
 *
 * @param value - The widget's value
 * @returns - The number `value` holds, or `undefined` if it holds none
 */
export default function toNumericValue(value: unknown): number | undefined {
  const numeric = typeof value === 'string' && DECIMAL.test(value) ? Number(value) : value;
  return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : undefined;
}
