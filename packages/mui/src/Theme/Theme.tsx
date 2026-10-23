import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../Templates/index.ts';
import { MUI_GLOBAL_UI_OPTIONS_KEYS } from '../util.ts';
import { createWidgets } from '../Widgets/index.ts';

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: every widget built on
 * the library's inputs draws its own label, the checkbox its description too, and, since this theme's template draws a
 * label only for a widget declared to leave it there, the option selector of an `anyOf`/`oneOf` names the field and the
 * fallback UI's value field labels itself. `@rjsf/core`'s rating and date parts draw no label, so the template draws
 * theirs, which `@rjsf/core` declares names them by reference. MUI's select names its combobox only through its
 * `labelId`, so a label the template draws for it, as for a `SelectWidget` declared `label: 'template'`, names it by
 * reference too. A text input or select draws its label inside its outline, so only the radio and checkbox groups and
 * the slider, which draw theirs above the control, declare so
 */
function createPresentation(): ThemePresentation {
  return {
    default: { label: 'self' },
    widgets: {
      CheckboxWidget: { label: 'self', description: 'self' },
      SelectWidget: { labelledBy: 'aria-labelledby' },
      RadioWidget: { labelPlacement: 'above' },
      CheckboxesWidget: { labelPlacement: 'above' },
      RangeWidget: { labelPlacement: 'above' },
      RatingWidget: { label: 'template' },
      AltDateWidget: { label: 'template' },
      AltDateTimeWidget: { label: 'template' },
    },
    fields: { AnyOfField: { label: 'self' }, OneOfField: { label: 'self' }, FallbackField: { label: 'self' } },
  };
}

function createTheme() {
  return {
    templates: createTemplates(),
    widgets: createWidgets(),
    presentation: createPresentation(),
    globalUiOptionsKeys: [...MUI_GLOBAL_UI_OPTIONS_KEYS],
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
