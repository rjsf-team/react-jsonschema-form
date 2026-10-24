import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { BOOTSTRAP3_CLASS_MAP } from './classMap.ts';
import { generateTemplates } from './Templates.ts';

/** The Bootstrap 3 theme: its class map and the templates whose markup is Bootstrap 3's, over `@rjsf/core`'s components
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
 */
export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return { templates: generateTemplates<T, S, F>(), classMap: { ...BOOTSTRAP3_CLASS_MAP } };
}

/** @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme */
export default generateTheme();
