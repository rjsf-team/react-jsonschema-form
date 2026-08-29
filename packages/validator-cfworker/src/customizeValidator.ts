import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { CustomValidatorOptionsType } from './types.js';
import CFWorkerValidator from './validator.js';

/** Creates a customized cfworker-backed `ValidatorType` implementation. */
export default function customizeValidator<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(options: CustomValidatorOptionsType = {}) {
  return new CFWorkerValidator<T, S, F>(options);
}
