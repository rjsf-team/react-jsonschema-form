import { ERRORS_KEY } from './constants.ts';
import isPlainObject from './isPlainObject.ts';
import type { FieldValidation, FormValidation } from './types.ts';

/** Given a `formData` object, recursively creates a `FormValidation` error handling structure around it
 *
 * @param formData - The form data around which the error handler is created
 * @returns - A `FormValidation` object based on the `formData` structure
 */
export default function createErrorHandler<T = any>(formData: T): FormValidation<T> {
  const handler: FieldValidation = {
    // We store the list of errors for this node in a property named __errors
    // to avoid name collision with a possible sub schema field named
    // 'errors' (see `utils.toErrorSchema`).
    [ERRORS_KEY]: [],
    addError(message: string) {
      this[ERRORS_KEY]!.push(message);
    },
  };
  if (Array.isArray(formData)) {
    return formData.reduce((acc, value, key) => ({ ...acc, [key]: createErrorHandler(value) }), handler);
  }
  if (isPlainObject(formData)) {
    return Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: createErrorHandler(formData[key]) }),
      handler as FormValidation<T>,
    );
  }
  return handler as FormValidation<T>;
}
