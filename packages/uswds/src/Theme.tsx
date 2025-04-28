import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
  RegistryWidgetsType,
} from '@rjsf/utils';
import templates from './Templates';
import { generateWidgets } from './Widgets'; // Import the named export

/** Create a theme object using the Form, Templates and Widgets defined in the theme
 *
 * @param props - The `ThemeProps` for the theme
 * @returns - The theme object
 */
export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): {
  templates: TemplatesType<T, S, F>;
  widgets: RegistryWidgetsType<T, S, F>;
} {
  const widgets = generateWidgets<T, S, F>(); // Call generateWidgets here
  return {
    templates: templates as TemplatesType<T, S, F>,
    widgets: widgets, // Use the generated widgets
  };
}

export default generateTheme();
