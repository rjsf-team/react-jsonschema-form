import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
  RegistryWidgetsType,
} from '@rjsf/utils';
import templates from './Templates';
import Widgets from './Widgets';

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
  return {
    // Cast to unknown first to bypass complex type comparison
    templates: templates as unknown as TemplatesType<T, S, F>,
    widgets: {} as RegistryWidgetsType<T, S, F>,
  };
}

/** The `Theme` object for the `@rjsf/uswds` theme.
 */
const Theme: ThemeProps = {
  templates: templates,
  widgets: Widgets,
};

export default generateTheme();
