import getUiOptions from './getUiOptions';
import { UiSchema } from './types';

export default function isCustomWidget<T = any, F = any>(uiSchema: UiSchema<T, F>) {
  return (
    // TODO: Remove the `&& uiSchema['ui:widget'] !== 'hidden'` once we support hidden widgets for arrays.
    // https://react-jsonschema-form.readthedocs.io/en/latest/usage/widgets/#hidden-widgets
    'widget' in getUiOptions<T, F>(uiSchema) &&
    getUiOptions<T, F>(uiSchema)['widget'] !== 'hidden'
  );
}
