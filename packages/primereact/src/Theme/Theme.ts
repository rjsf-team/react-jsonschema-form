import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ThemeProps } from '@rjsf/core';
import { Form as SuiForm } from 'semantic-ui-react';

import { generateTemplates } from '../Templates';
import { generateWidgets } from '../Widgets';

export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): ThemeProps<T, S, F> {
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
    _internalFormWrapper: SuiForm,
  };
}

export default generateTheme();
