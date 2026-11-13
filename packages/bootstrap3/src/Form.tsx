import type { ThemedForm } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { generateTheme } from './Theme.ts';

/** @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme */
export function generateForm<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemedForm<T, S, F> {
  // oxlint-disable-next-line typescript/no-deprecated -- the package's own export, deprecated with it
  return withTheme<T, S, F>(generateTheme<T, S, F>());
}

/** @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme */
// oxlint-disable-next-line typescript/no-deprecated -- the package's own export, deprecated with it
export default generateForm();
