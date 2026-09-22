import type { ThemedForm, ThemeProps } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import Templates, { generateTemplates } from './templates/index.ts';
import Widgets, { generateWidgets } from './widgets/index.ts';

const Theme = { templates: Templates, widgets: Widgets };

export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return Theme;
}

export function generateForm<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemedForm<T, S, F> {
  return withTheme<T, S, F>(generateTheme<T, S, F>());
}

const Form = generateForm();

export { Form, Templates, Theme, Widgets, generateTemplates, generateWidgets };

export default Form;
