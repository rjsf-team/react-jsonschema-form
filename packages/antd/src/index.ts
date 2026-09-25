import type { ThemedForm, ThemeProps } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import Templates, { createTemplates, generateTemplates } from './templates/index.ts';
import Widgets, { createWidgets, generateWidgets } from './widgets/index.ts';

function createTheme() {
  return { templates: createTemplates(), widgets: createWidgets() };
}

export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return createTheme();
}

export function generateForm<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemedForm<T, S, F> {
  return withTheme<T, S, F>(generateTheme<T, S, F>());
}

const Theme = createTheme();
const Form = generateForm();

export { Form, Templates, Theme, Widgets, generateTemplates, generateWidgets };

export default Form;
