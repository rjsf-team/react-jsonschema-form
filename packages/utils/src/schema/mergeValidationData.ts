import isEmpty from "lodash/isEmpty";

import mergeObjects from "../mergeObjects";
import {
  ErrorSchema,
  RJSFSchema,
  StrictRJSFSchema,
  ValidationData,
  ValidatorType,
} from "../types";

/** Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in the
 * two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling
 * `validator.toErrorList()` onto the `errors` in the `validationData`. If no `additionalErrorSchema` is passed, then
 * `validationData` is returned.
 *
 * @param validator - The validator used to convert an ErrorSchema to a list of errors
 * @param validationData - The current `ValidationData` into which to merge the additional errors
 * @param [additionalErrorSchema] - The additional set of errors in an `ErrorSchema`
 * @returns - The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.
 */
export default function mergeValidationData<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema
>(
  validator: ValidatorType<T, S>,
  validationData: ValidationData<T>,
  additionalErrorSchema?: ErrorSchema<T>
): ValidationData<T> {
  if (!additionalErrorSchema) {
    return validationData;
  }
  const { errors: oldErrors, errorSchema: oldErrorSchema } = validationData;
  let errors = validator.toErrorList(additionalErrorSchema);
  let errorSchema = additionalErrorSchema;
  if (!isEmpty(oldErrorSchema)) {
    errorSchema = mergeObjects(
      oldErrorSchema,
      additionalErrorSchema,
      true
    ) as ErrorSchema<T>;
    errors = [...oldErrors].concat(errors);
  }
  return { errorSchema, errors };
}
