import { withTheme } from '@rjsf/core';
import { RJSFSchema, StrictRJSFSchema, FormContextType } from '@rjsf/utils';

import { generateTheme } from '../theme/Theme';

/**
 * Generate a form with the DaisyUI theme
 */
export function generateForm<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>() {
  return withTheme(generateTheme<T, S, F>());
}

/**
 * Form component with DaisyUI theme
 */
const Form = generateForm();

export { Form, generateTheme };

export default Form;
