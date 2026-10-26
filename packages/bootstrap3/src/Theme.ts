import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { generateClassMap } from './classMap.ts';
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
  // oxlint-disable-next-line typescript/no-deprecated -- the package's own exports, deprecated with it
  return { templates: generateTemplates<T, S, F>(), classMap: generateClassMap() };
}

/** @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme */
// oxlint-disable-next-line typescript/no-deprecated -- the package's own export, deprecated with it
export default generateTheme();
