import isPlainObject from './isPlainObject.ts';
import type { ErrorSchema, FormValidation } from './types.ts';

/** Unwraps the `errorHandler` structure into the associated `ErrorSchema`, stripping the `addError()` functions from it
 *
 * @param errorHandler - The `FormValidation` error handling structure
 * @returns - The `ErrorSchema` resulting from the stripping of the `addError()` function
 */
export default function unwrapErrorHandler<T = any>(errorHandler: FormValidation<T>): ErrorSchema<T> {
  return unwrapErrors<T>(errorHandler);
}

/** Does the actual unwrapping, working on the plain-object shape of a `FormValidation` so that the recursive call for
 * a nested error handler does not need an assertion back to `FormValidation`.
 *
 * @param errors - The error handling structure, viewed as the plain object it is at runtime
 * @returns - The `ErrorSchema` resulting from the stripping of the `addError()` function
 */
function unwrapErrors<T>(errors: Record<string, unknown>): ErrorSchema<T> {
  return Object.keys(errors).reduce<ErrorSchema<T>>((acc, key) => {
    if (key === 'addError') {
      return acc;
    }
    const childSchema = errors[key];
    if (isPlainObject(childSchema)) {
      return {
        ...acc,
        [key]: unwrapErrors<T>(childSchema),
      };
    }
    return { ...acc, [key]: childSchema };
  }, {});
}
