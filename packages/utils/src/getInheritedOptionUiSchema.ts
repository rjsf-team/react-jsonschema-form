import type { ANY_OF_KEY, ONE_OF_KEY } from './constants.ts';
import { withoutFieldOptions } from './getOptionUiSchema.ts';
import getRenderedOptionUiSchema from './getRenderedOptionUiSchema.ts';
import getUiOptions from './getUiOptions.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';
import uiBooleanOption from './uiBooleanOption.ts';

/** Returns the uiSchema the field of an `anyOf`/`oneOf` option renders with, as far as the field's uiSchema decides it.
 * An option with no entry of its own renders with the field's uiSchema, without the field's `keyword` list, which
 * describes the field's options rather than any the option offers in turn. An option with an entry renders with it, as
 * `getRenderedOptionUiSchema()` gives it, and takes the field's `ui:required` where it leaves its own unset, so an option
 * offering options of its own hands it on to them in turn. `MultiSchemaField` and the `getUiRequiredErrorSchema()` walk
 * both read the option's uiSchema through it, so a field marked required at any depth of options is required by both.
 *
 * @param schema - The schema of the field offering the options
 * @param option - The option shown, with its own `$ref` resolved, if one is
 * @param uiSchema - The field's uiSchema
 * @param optionUiSchema - The uiSchema `selectOptionUiSchema()` or `getOptionUiSchema()` picked for the option
 * @param keyword - Which of `oneOf`/`anyOf` the field offers its options under
 * @returns - The uiSchema the option's field renders with
 */
export default function getInheritedOptionUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  option: S | null | undefined,
  uiSchema: UiSchema<T, S, F> | undefined,
  optionUiSchema: UiSchema<T, S, F> | undefined,
  keyword: typeof ANY_OF_KEY | typeof ONE_OF_KEY,
): UiSchema<T, S, F> | undefined {
  if (optionUiSchema === uiSchema) {
    return withoutFieldOptions<T, S, F>(uiSchema, uiSchema, keyword);
  }
  const rendered = option
    ? getRenderedOptionUiSchema<T, S, F>(schema, option, uiSchema, optionUiSchema)
    : optionUiSchema;
  const fieldUiRequired = uiSchema ? uiBooleanOption(getUiOptions<T, S, F>(uiSchema).required) : undefined;
  if (fieldUiRequired === undefined || (rendered && getUiOptions<T, S, F>(rendered).required !== undefined)) {
    return rendered;
  }
  // A generic `UiSchema<T, S, F>` spread is a type the checker can't relate back to it
  return { ...(rendered as UiSchema<T, S, F>), 'ui:required': fieldUiRequired };
}
