import { RJSFSchema, StrictRJSFSchema, ValidatorType } from "@rjsf/utils";

import { CustomValidatorOptionsType, Localizer } from "./types";
import AJV8Validator from "./validator";

/** Creates and returns a customized implementation of the `ValidatorType` with the given customization `options` if
 * provided.
 *
 * @param [options={}] - The `CustomValidatorOptionsType` options that are used to create the `ValidatorType` instance
 * @param [localizer] - If provided, is used to localize a list of Ajv `ErrorObject`s
 */
export default function customizeValidator<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema
>(
  options: CustomValidatorOptionsType = {},
  localizer?: Localizer
): ValidatorType<T, S> {
  return new AJV8Validator<T, S>(options, localizer);
}
