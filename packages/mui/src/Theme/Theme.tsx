import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../Templates/index.ts';
import { createWidgets } from '../Widgets/index.ts';

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: every widget built on
 * the library's inputs draws its own label, the checkbox its description too, and, since this theme's template draws a
 * label only for a widget declared to leave it there, the option selector of an `anyOf`/`oneOf` names the field and the
 * fallback UI's value field labels itself. `@rjsf/core`'s rating and date parts draw no label, so the template draws
 * theirs; the date parts' group carries the field's id on a list, which a `for` can't label, so that label names it by
 * reference
 */
function createPresentation(): ThemePresentation {
  return {
    default: { label: 'self' },
    widgets: {
      CheckboxWidget: { label: 'self', description: 'self' },
      RatingWidget: { label: 'template' },
      AltDateWidget: { label: 'template', labelledBy: 'aria-labelledby' },
      AltDateTimeWidget: { label: 'template', labelledBy: 'aria-labelledby' },
    },
    fields: { AnyOfField: { label: 'self' }, OneOfField: { label: 'self' }, FallbackField: { label: 'self' } },
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
