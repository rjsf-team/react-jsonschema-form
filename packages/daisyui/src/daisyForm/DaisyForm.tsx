import { ComponentType } from 'react';
import { withTheme, FormProps } from '@rjsf/core';
import { generateTheme } from '../theme';
import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export function generateForm<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): ComponentType<FormProps<T, S, F>> {
  const theme = generateTheme<T, S, F>();
  return withTheme<T, S, F>(theme);
}

const Form = generateForm();

export { Form, generateTheme };

export default Form;

function selectWidget(schema: RJSFSchema, widget?: string) {
  if (schema.type === 'array' && schema.uniqueItems && schema.items && (schema.items as RJSFSchema).enum) {
    return 'checkboxes';
  }
  return widget;
}
