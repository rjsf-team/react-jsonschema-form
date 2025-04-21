import {
  ThemeProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { generateTemplates } from "./Templates"; // Import the generator function
import { generateWidgets } from "./Widgets"; // Import the generator function

/** The `generateTheme` function generates the theme object for the USWDS theme.
 * It is used to merge the generated templates and widgets into a single theme object.
 *
 * @returns The `ThemeProps` object for the USWDS theme
 */
export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): ThemeProps<T, S, F> {
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
  };
}

const Theme = generateTheme(); // Generate the theme for the default export

export default Theme;
