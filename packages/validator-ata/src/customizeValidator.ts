import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { CustomValidatorOptionsType, Localizer } from './types';
import ATAValidator from './validator';

/** Build an `ATAValidator` instance, optionally customized with format
 * checkers, validator overrides, an extender hook, or a localizer. Mirrors
 * `@rjsf/validator-ajv8`'s `customizeValidator`.
 */
export default function customizeValidator<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(options: CustomValidatorOptionsType = {}, localizer?: Localizer) {
  return new ATAValidator<T, S, F>(options, localizer);
}
