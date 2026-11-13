import type { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { CustomValidatorOptionsType, Localizer } from './types.ts';
import ATAValidator from './validator.ts';

/** Build an `ATAValidator` instance, optionally customized with format
 * checkers, validator overrides, an extender hook, or a localizer. Mirrors
 * `@rjsf/validator-ajv8`'s `customizeValidator`.
 */
export default function customizeValidator<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(options: CustomValidatorOptionsType = {}, localizer?: Localizer) {
  return new ATAValidator<S, F>(options, localizer);
}
