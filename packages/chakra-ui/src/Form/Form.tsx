import { ComponentType } from 'react';
import { withTheme, FormProps } from '@rjsf/core';
import { generateTheme } from '../Theme';
import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export function generateForm<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): ComponentType<FormProps<T, S, F>> {
  return withTheme<T, S, F>(generateTheme<T, S, F>());
}

export default generateForm();
