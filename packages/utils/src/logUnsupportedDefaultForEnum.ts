import enumOptionsIndexForValue from './enumOptionsIndexForValue';
import type { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from './types';

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
