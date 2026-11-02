import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { getRenderedOptionUiSchema, UI_OPTIONS_KEY } from '@rjsf/utils';

/** Returns the field's `uiSchema` for an option that declares none of its own, without the field's title and
 * description, which the field's plan already carries to the option's, so the option keeps the title and description
 * its own schema gives it rather than taking the field's in their place. Shadowed in `ui:options` as well, as
 * `getUiOptions()` reads either spelling
 *
 * @param uiSchema - The field's uiSchema
 * @returns - The uiSchema the option renders with
 */
function withoutFieldText<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F>,
): UiSchema<T, S, F> {
  const options = uiSchema[UI_OPTIONS_KEY];
  if (
    !('ui:title' in uiSchema) &&
    !('ui:description' in uiSchema) &&
    options?.title === undefined &&
    options?.description === undefined
  ) {
    return uiSchema;
  }
  const { 'ui:title': _title, 'ui:description': _description, ...rest } = uiSchema;
  return { ...rest, [UI_OPTIONS_KEY]: { ...options, title: undefined, description: undefined } };
}

/** Returns the uiSchema the `SchemaField` of an `anyOf`/`oneOf` option renders with, which `AnyOfField` renders it with
 * and `SchemaField` plans the field's label by: the field's own, without its title and description, for an option
 * declaring none of its own, or else the option's, with the field's say over the extra keys the option takes
 *
 * @param schema - The schema of the field rendering the options
 * @param option - The option shown, with its own `$ref` resolved, if one is
 * @param uiSchema - The field's uiSchema
 * @param optionUiSchema - The uiSchema `selectOptionUiSchema()` picked for the option
 * @returns - The uiSchema the option renders with
 */
export default function getOptionFieldUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  option: S | null | undefined,
  uiSchema: UiSchema<T, S, F> | undefined,
  optionUiSchema: UiSchema<T, S, F> | undefined,
): UiSchema<T, S, F> | undefined {
  if (uiSchema && optionUiSchema === uiSchema) {
    return withoutFieldText<T, S, F>(uiSchema);
  }
  return option ? getRenderedOptionUiSchema<T, S, F>(schema, option, uiSchema, optionUiSchema) : optionUiSchema;
}
