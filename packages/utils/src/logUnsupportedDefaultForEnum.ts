import enumOptionsIndexForValue from './enumOptionsIndexForValue';
import type { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from './types';

/** Logs a warning when a single-select enum widget has a schema default that is not one of its enum options.
 *
 * @param id - The field id used in the warning message
 * @param schema - The schema whose default value is checked
 * @param enumOptions - The enum options available to the widget
 * @param multiple - Whether the widget allows multiple selections
 */
export default function logUnsupportedDefaultForEnum<S extends StrictRJSFSchema = RJSFSchema>(
  id: string,
  schema: S,
  enumOptions?: EnumOptionsType<S>[],
  multiple = false,
) {
  if (
    !multiple &&
    Array.isArray(enumOptions) &&
    schema.default !== undefined &&
    enumOptionsIndexForValue<S>(schema.default, enumOptions, multiple) === undefined
  ) {
    // oxlint-disable-next-line no-console
    console.error(
      `The schema default value "${schema.default}" is not one of the values in the enum options for "${id}"`,
    );
  }
}
