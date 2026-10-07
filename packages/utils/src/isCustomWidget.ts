import getUiOptions from './getUiOptions.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Checks to see if the `uiSchema` names a `widget` and that the widget is not `hidden`. A `widget` set to `undefined`
 * names none: it is how a `uiSchema` shadows a `widget` in `ui:globalOptions`
 *
 * @param uiSchema - The UI Schema from which to detect if it is customized
 * @returns - True if the `uiSchema` describes a custom widget, false otherwise
 */
export default function isCustomWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F> = {}) {
  const { widget } = getUiOptions<T, S, F>(uiSchema);
  // TODO: Remove the `&& widget !== 'hidden'` once we support hidden widgets for arrays.
  // https://rjsf-team.github.io/react-jsonschema-form/docs/usage/widgets/#hidden-widgets
  return widget !== undefined && widget !== 'hidden';
}
