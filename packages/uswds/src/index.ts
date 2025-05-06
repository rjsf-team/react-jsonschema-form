import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  RegistryWidgetsType, // Import RegistryWidgetsType for casting
} from '@rjsf/utils';
import { ThemeProps, withTheme } from '@rjsf/core'; // Import ThemeProps and withTheme

import generateTemplates from './Templates';
// Use a named import to get the function, not the default export (which is the result object)
import { generateWidgets } from './Widgets';
// import generateFields from './Fields'; // Uncomment if fields are implemented

/** The `generateTheme` function can be used to generate a theme based on the templates and widgets provided by this
 * library. It is exported for advanced use cases where one needs to provide additional templates or widgets to the
 * theme.
 *
 * @param props - The props passed to the `generateTheme` function
 */
export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): ThemeProps<T, S, F> {
  return {
    templates: generateTemplates<T, S, F>(),
    // Now generateWidgets refers to the function and can be called
    widgets: generateWidgets<T, S, F>() as RegistryWidgetsType<T, S, F>,
    // fields: generateFields<T, S, F>(), // Include fields if they exist
  };
}

/** The `Theme` object contains the templates and widgets provided by this library. It is the default export and
 * should be used directly with RJSF core like:
 *
 * ```jsx
 * import Form from '@rjsf/core';
 * import Theme from '@rjsf/uswds';
 *
 * <Form validator={validator} theme={Theme} />
 * ```
 */
const Theme = generateTheme();

export { Theme };

/** The `Form` component is a wrapper around `@rjsf/core`'s Form component that automatically applies the theme.
 * It is exported for convenience but is not the default export.
 *
 * ```jsx
 * import { Form } from '@rjsf/uswds';
 *
 * <Form validator={validator} />
 * ```
 */
export const Form = withTheme(Theme);

// Default export is the theme object
export default Theme;
