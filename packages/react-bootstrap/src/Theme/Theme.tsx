import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import Templates from '../Templates/index.ts';
import Widgets from '../Widgets/index.ts';

const theme = { templates: Templates, widgets: Widgets };

export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return theme;
}

export default theme;
