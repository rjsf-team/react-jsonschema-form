import type {
  FormContextType,
  GlobalUISchemaOptions,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  UiSchema,
} from '@rjsf/utils';
import { UI_FIELD_KEY, UI_OPTIONS_KEY } from '@rjsf/utils';

const HELP_UI_KEY = 'ui:help';

/** Returns the `uiSchema` `MultiSchemaField` renders the selected option with: `optionUiSchema` without the `ui:field`
 * and `ui:help` that the field around the option has already rendered. That field renders for the same `id`, so an
 * inherited `ui:field` would render a second copy of the parent's field, and an inherited `ui:help` a second copy of
 * the help under the DOM id the control's `aria-describedby` names.
 *
 * An option that inherits its parent's `uiSchema`, for having no `uiSchema.oneOf`/`anyOf` entry of its own, has both
 * dropped wherever they were written. One with its own entry keeps a `ui:field` or `ui:help` it declares, since that
 * is the option's rather than the parent's, but has a `ui:globalOptions` one shadowed, which the parent has already
 * rendered too. Shadowed rather than deleted, as `FallbackField` does: `getUiOptions()` layers the global options
 * under the local ones, so only a local `undefined` keeps a global one from showing through.
 *
 * @param optionUiSchema - The option's `uiSchema`, from `selectOptionUiSchema()`
 * @param isInherited - Whether `optionUiSchema` is the parent's own `uiSchema`, rather than the option's entry
 * @param [globalUiOptions] - The form's `ui:globalOptions`
 * @returns - `optionUiSchema` itself when there is nothing to drop, otherwise a copy without it
 */
export default function optionUiSchemaForRender<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  optionUiSchema: UiSchema<T, S, F> | undefined,
  isInherited: boolean,
  globalUiOptions?: GlobalUISchemaOptions,
): UiSchema<T, S, F> | undefined {
  const ownOptions = optionUiSchema?.[UI_OPTIONS_KEY];
  const declaresField = optionUiSchema?.[UI_FIELD_KEY] !== undefined || ownOptions?.field !== undefined;
  const declaresHelp = optionUiSchema?.[HELP_UI_KEY] !== undefined || ownOptions?.help !== undefined;
  const shadowsField = declaresField ? isInherited : globalUiOptions?.field !== undefined;
  const shadowsHelp = declaresHelp ? isInherited : globalUiOptions?.help !== undefined;
  if (!shadowsField && !shadowsHelp) {
    return optionUiSchema;
  }
  const noUiSchema: UiSchema<T, S, F> = {};
  const renderedUiSchema = { ...(optionUiSchema ?? noUiSchema) };
  const renderedOptions = { ...ownOptions } as UIOptionsType<T, S, F>;
  if (shadowsField) {
    delete renderedUiSchema[UI_FIELD_KEY];
    renderedOptions.field = undefined;
  }
  if (shadowsHelp) {
    delete renderedUiSchema[HELP_UI_KEY];
    renderedOptions.help = undefined;
  }
  renderedUiSchema[UI_OPTIONS_KEY] = renderedOptions;
  return renderedUiSchema;
}
