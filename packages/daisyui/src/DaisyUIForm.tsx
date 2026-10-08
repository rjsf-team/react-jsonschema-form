import type { ThemedForm } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { generateTheme } from './theme/index.ts';

/** Generates a `Form` pre-configured with the DaisyUI theme, allowing the generics to be overridden
 *
 * @returns A `Form` component using the DaisyUI theme
 */
export function generateForm<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemedForm<T, S, F> {
  return withTheme<T, S, F>(generateTheme<T, S, F>());
}

/** Form component pre-configured with the DaisyUI theme */
export default generateForm();
