import { ERRORS_KEY } from './constants.ts';
import isPlainObject from './isPlainObject.ts';
import type { ErrorSchema, RJSFValidationError } from './types.ts';

/** Converts an `errorSchema` into a list of `RJSFValidationErrors`
 *
 * @param errorSchema - The `ErrorSchema` instance to convert
 * @param [fieldPath=[]] - The current field path, defaults to [] if not specified
 * @returns - The list of `RJSFValidationErrors` extracted from the `errorSchema`
 */
export default function toErrorList<T = any>(
  errorSchema?: ErrorSchema<T>,
  fieldPath: string[] = [],
): RJSFValidationError[] {
  return errorSchema ? errorsFrom(errorSchema, fieldPath) : [];
}

/** Does the actual conversion, working on the plain-object shape of an `ErrorSchema` so that the recursive call for a
 * nested error schema does not need an assertion back to `ErrorSchema`.
 *
 * @param errorSchema - The error schema, viewed as the plain object it is at runtime
 * @param fieldPath - The current field path
 * @returns - The list of `RJSFValidationErrors` extracted from the `errorSchema`
 */
function errorsFrom(errorSchema: Record<string, unknown>, fieldPath: string[]): RJSFValidationError[] {
  const errors = errorSchema[ERRORS_KEY];
  const property = `.${fieldPath.join('.')}`;
  const errorList: RJSFValidationError[] = Array.isArray(errors)
    ? errors.map((message: string) => ({ property, message, stack: `${property} ${message}` }))
    : [];
  return Object.keys(errorSchema).reduce((currentList, key) => {
    const childSchema = errorSchema[key];
    if (key !== ERRORS_KEY && isPlainObject(childSchema)) {
      return currentList.concat(errorsFrom(childSchema, [...fieldPath, key]));
    }
    return currentList;
  }, errorList);
}
