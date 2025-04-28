import { withTheme, ThemeProps } from '@rjsf/core';
import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import Theme from '../Theme';

export function generateForm<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>() {
  return withTheme<T, S, F>(Theme as ThemeProps<T, S, F>);
}

export default generateForm();
