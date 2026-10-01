import toDisplayString from './toDisplayString.ts';

/** Returns the label for an enum option with no title of its own: its value, with a plain object or array spelled out
 * as JSON, since `String()` would label every one of them `[object Object]`. It is the `toDisplayString()` warnings
 * use, so a value reads the same in an option label as in a warning about it
 *
 * @param value - The option's value
 * @returns - The text to label the option with
 */
export default function enumOptionValueLabel(value: unknown): string {
  return toDisplayString(value);
}
