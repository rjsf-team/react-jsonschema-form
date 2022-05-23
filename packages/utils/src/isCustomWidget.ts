import getUiOptions from './getUiOptions';
import { UiSchema } from './types';

/** Checks to see if the `uiSchema` contains the `widget` field and that the widget is not `hidden`
 *
 * @param uiSchema - The UI Schema from which to detect if it is customized
 * @returns - True if the `uiSchema` describes a custome widget, false otherwise
 */
export default function isCustomWidget<T = any, F = any>(uiSchema: UiSchema<T, F>) {
  return (
    // TODO: Remove the `&& uiSchema['ui:widget'] !== 'hidden'` once we support hidden widgets for arrays.
    // https://react-jsonschema-form.readthedocs.io/en/latest/usage/widgets/#hidden-widgets
    'widget' in getUiOptions<T, F>(uiSchema) &&
    getUiOptions<T, F>(uiSchema)['widget'] !== 'hidden'
  );
}
