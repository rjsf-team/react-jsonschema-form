import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../Templates/index.ts';
import { createWidgets } from '../Widgets/index.ts';

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: the slider's thumb is
 * named by the template's label through `aria-labelledby`, since a `for` can't reach a thumb, which isn't a form control
 */
function createPresentation(): ThemePresentation {
  return { widgets: { RangeWidget: { labelledBy: 'aria-labelledby' } } };
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
