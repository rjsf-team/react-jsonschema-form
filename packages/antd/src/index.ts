import { ComponentType } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { FormProps, ThemeProps, withTheme } from '@rjsf/core';

import Templates, { generateTemplates } from './templates';
import Widgets, { generateWidgets } from './widgets';

export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): ThemeProps<T, S, F> {
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
  };
}

const Theme = generateTheme();

export function generateForm<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): ComponentType<FormProps<T, S, F>> {
  return withTheme<T, S, F>(generateTheme<T, S, F>());
}

const Form = generateForm();

export { Form, Templates, Theme, Widgets, generateTemplates, generateWidgets };

export default Form;
