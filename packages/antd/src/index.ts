import type { ThemedForm, ThemeProps } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { ANTD_GLOBAL_UI_OPTIONS_KEYS } from './globalUiOptions.ts';
import Templates, { createTemplates, generateTemplates } from './templates/index.ts';
import Widgets, { createWidgets, generateWidgets } from './widgets/index.ts';

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: the template draws
 * every field's description, a checkbox's included, which the checkbox doesn't draw itself, and the slider's handle is
 * named by the template's label through `aria-labelledby`, since a `for` could reach only the slider's root
 */
function createPresentation(): ThemePresentation {
  return {
    widgets: {
      CheckboxWidget: { label: 'self', description: 'template' },
      RangeWidget: { labelledBy: 'aria-labelledby' },
    },
    fieldDefault: { description: 'template' },
  };
}

function createTheme() {
  return {
    templates: createTemplates(),
    widgets: createWidgets(),
    presentation: createPresentation(),
    globalUiOptionsKeys: [...ANTD_GLOBAL_UI_OPTIONS_KEYS],
  };
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
export type {
  AntdGlobalUiOptionsKeys,
  AntdGlobalUISchemaOptions,
  AntdUiSchema as UiSchema,
} from './globalUiOptions.ts';

export default Form;
