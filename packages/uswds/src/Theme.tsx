import {
  ThemeProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { generateTemplates } from "./Templates";
import { generateWidgets } from "./Widgets";

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
  // Always use the generated templates and widgets (which now use @trussworks/react-uswds)
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
  };
}

// Generate the default theme
const Theme = generateTheme();

export default Theme;
