import { FormContextType, RJSFSchema, StrictRJSFSchema, ValidatorType } from '@rjsf/utils';

import { CustomValidatorOptionsType } from './types';
import AJV6Validator from './validator';

/** Creates and returns a customized implementation of the `ValidatorType` with the given customization `options` if
 * provided.
 *
 * @param [options={}] - The `CustomValidatorOptionsType` options that are used to create the `ValidatorType` instance
 * @deprecated in favor of the `@rjsf/validator-ajv8
 */
export default function customizeValidator<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(options: CustomValidatorOptionsType = {}): ValidatorType<T, S, F> {
  return new AJV6Validator<T, S, F>(options);
}
