import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { createTemplates } from '../Templates/index.ts';
import { createWidgets } from '../Widgets/index.ts';

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

export default createTheme();
