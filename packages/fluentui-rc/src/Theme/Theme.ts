import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../Templates/index.ts';
import { createWidgets } from '../Widgets/index.ts';

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: every widget built on
 * the library's inputs draws its own label above its control, the checkbox its label beside it and its description
 * too, and, since this theme's template draws a label only for a widget declared to leave it there, the option selector
 * of an `anyOf`/`oneOf` names the field from above and the fallback UI's value field labels itself, wherever its widget
 * draws that label. `@rjsf/core`'s rating and date parts draw no label, so the template draws theirs. `@rjsf/core`
 * declares those widgets named by that label by reference, not `for`, since the element carrying the field's id is a
 * `<div>`, which a `for` can't label, and its declaration lies beneath this theme's
 */
function createPresentation(): ThemePresentation {
  return {
    default: { label: 'self', labelPlacement: 'above' },
    widgets: {
      CheckboxWidget: { label: 'self', description: 'self', labelPlacement: 'beside' },
      RatingWidget: { label: 'template' },
      AltDateWidget: { label: 'template' },
      AltDateTimeWidget: { label: 'template' },
    },
    fields: {
      AnyOfField: { label: 'self', labelPlacement: 'above' },
      OneOfField: { label: 'self', labelPlacement: 'above' },
      FallbackField: { label: 'self' },
    },
  };
}

function createTheme() {
  return { templates: createTemplates(), widgets: createWidgets(), presentation: createPresentation() };
}

export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return createTheme();
}

export default createTheme();
