import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../Templates/index.ts';
import { createWidgets } from '../Widgets/index.ts';

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: every widget built on
 * the library's inputs draws its own label, the checkbox its description too, and, since this theme's template draws
 * no label, the option selector of an `anyOf`/`oneOf` names the field and the fallback UI's value field labels itself
 */
function createPresentation(): ThemePresentation {
  return {
    default: { label: 'self' },
    widgets: { CheckboxWidget: { label: 'self', description: 'self' } },
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
