import { SUBMIT_BTN_OPTIONS_KEY } from './constants.ts';
import getUiOptions from './getUiOptions.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema, UISchemaSubmitButtonOptions } from './types.ts';

/** The submit button options with their `props` always present */
type SubmitButtonOptions = UISchemaSubmitButtonOptions & Required<Pick<UISchemaSubmitButtonOptions, 'props'>>;

/** The default submit button options, exported for testing purposes
 */
export const DEFAULT_OPTIONS: SubmitButtonOptions = {
  props: {
    disabled: false,
  },
  submitText: 'Submit',
  norender: false,
};

/** Extracts any `ui:submitButtonOptions` from the `uiSchema` and merges them onto the `DEFAULT_OPTIONS`, taking the
 * default `props` for missing ones, or ones a JSON uiSchema sets to `null`
 *
 * @param [uiSchema={}] - the UI Schema from which to extract submit button props
 * @returns - The merging of the `DEFAULT_OPTIONS` with any custom ones
 */
export default function getSubmitButtonOptions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F> = {}): SubmitButtonOptions {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  if (uiOptions?.[SUBMIT_BTN_OPTIONS_KEY]) {
    const options = uiOptions[SUBMIT_BTN_OPTIONS_KEY];
    return { ...DEFAULT_OPTIONS, ...options, props: options.props ?? DEFAULT_OPTIONS.props };
  }

  return DEFAULT_OPTIONS;
}
