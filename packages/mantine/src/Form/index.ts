import type { ThemedForm } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { generateTheme } from '../Theme/index.ts';

export function generateForm<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemedForm<T, S, F> {
  return withTheme<T, S, F>(generateTheme<T, S, F>());
}

export default generateForm();
