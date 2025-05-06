import { FormContextType, RJSFSchema, RegistryWidgetsType } from '@rjsf/utils';
import { ThemeProps } from '@rjsf/core';
import generateTemplates from '../Templates';
import { generateWidgets } from '../Widgets';

export function generateTheme<
  T = any,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): ThemeProps<T, S, F> {
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>() as RegistryWidgetsType<T, S, F>,
  };
}

export default generateTheme();
