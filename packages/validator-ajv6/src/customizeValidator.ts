import { ValidatorType } from "@rjsf/utils";

import { CustomValidatorOptionsType } from "./types";
import AJV6Validator from "./validator";

/** Creates and returns a customized implementation of the `ValidatorType` with the given customization `options` if
 * provided.
 *
 * @param [options={}] - The `CustomValidatorOptionsType` options that are used to create the `ValidatorType` instance
 */
export default function customizeValidator<T = any>(
  options: CustomValidatorOptionsType = {}
): ValidatorType<T> {
  return new AJV6Validator<T>(options);
}
