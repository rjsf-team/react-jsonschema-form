import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { MANTINE_GLOBAL_UI_OPTIONS_KEYS } from '../globalUiOptions.ts';
import { createTemplates } from '../templates/index.ts';
import { createWidgets } from '../widgets/index.ts';

// `@rjsf/core`'s widgets this theme renders through its own `BaseInputTemplate`, which draws their errors. The
// declaration belongs to the widget keys, so a `BaseInputTemplate` replacing this theme's has to draw them too
const baseInputWidgetKeys = ['TextWidget', 'EmailWidget', 'URLWidget', 'UpDownWidget'];

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: every widget draws its
 * own label above its control, the checkbox beside it, and its description, the option selector of an `anyOf`/`oneOf`
 * names the field from above and describes it, and the fallback UI's value field labels itself, below the type
 * selector, whose own label sits above it as the option selector's does, since this theme's template draws a label and
 * description only for a widget declared to leave them there, as `@rjsf/core`'s `RatingWidget` is, which draws neither,
 * and an object's own template draws its errors. This theme's widgets, and the `@rjsf/core` widgets it renders through
 * its `BaseInputTemplate`, draw their errors in Mantine's error slot; any other widget, such as `RatingWidget` or one
 * of your own, leaves them to the template, since a widget that draws none would otherwise lose them
 *
 * @param widgetKeys - The keys this theme registers its own widgets under
 */
function createPresentation(widgetKeys: readonly string[]): ThemePresentation {
  return {
    default: { label: 'self', description: 'self', labelPlacement: 'above' },
    widgets: {
      ...Object.fromEntries([...widgetKeys, ...baseInputWidgetKeys].map((key) => [key, { errors: 'self' } as const])),
      // The slider's thumb, which carries the field id, is a `div`, which a label's `for` can't name. `@rjsf/core`
      // already declares its alt-date widgets so, and its declaration is layered beneath this theme's
      RangeWidget: { errors: 'self', labelledBy: 'aria-labelledby' },
      CheckboxWidget: { errors: 'self', labelPlacement: 'beside' },
      RatingWidget: { label: 'template', description: 'template' },
    },
    fields: {
      AnyOfField: { label: 'self', description: 'self', labelPlacement: 'above' },
      OneOfField: { label: 'self', description: 'self', labelPlacement: 'above' },
      FallbackField: { label: 'self', labelPlacement: 'above' },
      ObjectField: { errors: 'self' },
    },
  };
}

function createTheme() {
  const widgets = createWidgets();
  return {
    templates: createTemplates(),
    widgets,
    presentation: createPresentation(Object.keys(widgets)),
    globalUiOptionsKeys: [...MANTINE_GLOBAL_UI_OPTIONS_KEYS],
  };
}

export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return createTheme();
}

export default createTheme();
