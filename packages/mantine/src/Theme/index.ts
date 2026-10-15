import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../templates/index.ts';
import { createWidgets } from '../widgets/index.ts';

// `@rjsf/core`'s widgets this theme renders through its own `BaseInputTemplate`, which draws their errors. The
// declaration belongs to the widget keys, so a `BaseInputTemplate` replacing this theme's has to draw them too
const baseInputWidgetKeys = ['TextWidget', 'EmailWidget', 'URLWidget', 'UpDownWidget'];

// This theme's widgets whose field id is on no element a label's `for` can name: the slider's thumb is a `div`, and an
// alt-date's parts each take an id of their own
const labelledByWidgetKeys: ReadonlySet<string> = new Set(['RangeWidget', 'AltDateWidget', 'AltDateTimeWidget']);

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: every widget draws its
 * own label and description, the option selector of an `anyOf`/`oneOf` names and describes the field and the fallback
 * UI's value field labels itself, since this theme's template draws neither, and an object's own template draws its
 * errors. This theme's widgets, and the `@rjsf/core` widgets it renders through its `BaseInputTemplate`, draw their
 * errors in Mantine's error slot; any other widget, such as `@rjsf/core`'s `RatingWidget` or one of your own, leaves
 * them to the template, since a widget that draws none would otherwise lose them
 *
 * @param widgetKeys - The keys this theme registers its own widgets under
 */
function createPresentation(widgetKeys: readonly string[]): ThemePresentation {
  return {
    default: { label: 'self', description: 'self' },
    widgets: Object.fromEntries(
      [...widgetKeys, ...baseInputWidgetKeys].map((key) => [
        key,
        { errors: 'self', ...(labelledByWidgetKeys.has(key) && { labelledBy: 'aria-labelledby' }) } as const,
      ]),
    ),
    fields: {
      AnyOfField: { label: 'self', description: 'self' },
      OneOfField: { label: 'self', description: 'self' },
      FallbackField: { label: 'self' },
      ObjectField: { errors: 'self' },
    },
  };
}

function createTheme() {
  const widgets = createWidgets();
  return { templates: createTemplates(), widgets, presentation: createPresentation(Object.keys(widgets)) };
}

export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return createTheme();
}

export default createTheme();
