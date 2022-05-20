import getUiOptions from './getUiOptions';
import { UiSchema, UISchemaSubmitButtonOptions } from './types';

export default function getSubmitButtonOptions<T = any, F = any>(uiSchema: UiSchema<T, F>) {
  const uiOptions = getUiOptions<T, F>(uiSchema);
  const defaultOptions = {
    props: {
      disabled: false,
    },
    submitText: 'Submit',
    norender: false,
  };
  if (uiOptions && uiOptions['submitButtonOptions']) {
    const options = uiOptions['submitButtonOptions'] as UISchemaSubmitButtonOptions;
    return { ...defaultOptions, ...options };
  }

  return defaultOptions;
}
