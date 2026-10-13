import type { EnumValue } from './types.ts';

/** Determines whether the option with the given `value` is one the `ui:enumDisabled` list disables. The values match
 * strictly, and an `enumDisabled` that isn't a list disables nothing.
 *
 * @param value - The value of the enum option being checked
 * @param [enumDisabled] - The `ui:enumDisabled` list of enum values that should be rendered disabled
 * @returns - true if `enumDisabled` lists the `value`, false otherwise
 */
export default function enumOptionsIsDisabled(value: unknown, enumDisabled?: EnumValue[]): boolean {
  return Array.isArray(enumDisabled) && enumDisabled.some((disabledValue) => disabledValue === value);
}
