import { FormProps, ThemeProps, withTheme } from '@rjsf/core';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
  UiSchema,
  ValidatorType,
  WidgetsType,
} from '@rjsf/utils';

import Templates, { generateTemplates } from './Templates';
import Widgets, { generateWidgets } from './Widgets';
import Fields, { generateFields } from './Fields'; // Correct import from the new file

// Modify the theme object generation
export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): ThemeProps<T, S, F> {
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
    fields: generateFields<T, S, F>(), // Include generated fields
  };
}

const Theme = generateTheme();

export function generateForm<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): React.ComponentClass<FormProps<T, S, F>> {
  return withTheme<T, S, F>(Theme);
}

const Form = generateForm();

export default Form;

export { Templates, Widgets, Fields, Theme }; // Ensure Fields and Theme are exported
