import { SUBMIT_BTN_OPTIONS_KEY } from "./constants";
import getUiOptions from "./getUiOptions";
import { UiSchema, UISchemaSubmitButtonOptions } from "./types";

/** The default submit button options, exported for testing purposes
 */
export const DEFAULT_OPTIONS: UISchemaSubmitButtonOptions = {
  props: {
    disabled: false,
  },
  submitText: "Submit",
  norender: false,
};

/** Extracts any `ui:submitButtonOptions` from the `uiSchema` and merges them onto the `DEFAULT_OPTIONS`
 *
 * @param [uiSchema={}] - the UI Schema from which to extract submit button props
 * @returns - The merging of the `DEFAULT_OPTIONS` with any custom ones
 */
export default function getSubmitButtonOptions<T = any, F = any>(
  uiSchema: UiSchema<T, F> = {}
): UISchemaSubmitButtonOptions {
  const uiOptions = getUiOptions<T, F>(uiSchema);
  if (uiOptions && uiOptions[SUBMIT_BTN_OPTIONS_KEY]) {
    const options = uiOptions[
      SUBMIT_BTN_OPTIONS_KEY
    ] as UISchemaSubmitButtonOptions;
    return { ...DEFAULT_OPTIONS, ...options };
  }

  return DEFAULT_OPTIONS;
}
