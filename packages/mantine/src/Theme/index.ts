import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../templates/index.ts';
import { createWidgets } from '../widgets/index.ts';

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: every widget draws its
 * own label and description, the option selector of an `anyOf`/`oneOf` names and describes the field, since this
 * theme's template draws neither, and an object's own template draws its errors. A widget's errors stay with the
 * template, whose hidden copy describes a widget that leaves them out of its wrapper
 */
function createPresentation(): ThemePresentation {
  return {
    default: { label: 'self', description: 'self' },
    fields: {
      AnyOfField: { label: 'self', description: 'self' },
      OneOfField: { label: 'self', description: 'self' },
      ObjectField: { errors: 'self' },
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
