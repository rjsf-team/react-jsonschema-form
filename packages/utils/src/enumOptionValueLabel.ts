import isContainerValue from './isContainerValue.ts';

/** Returns the label for an enum option with no title of its own: its value, with an object or array spelled out as
 * JSON, since `String()` would label every one of them `[object Object]`
 *
 * @param value - The option's value
 * @returns - The text to label the option with
 */
export default function enumOptionValueLabel(value: unknown): string {
  return isContainerValue(value) ? JSON.stringify(value) : String(value);
}
