import isPlainObject from './isPlainObject.ts';
import { isErrorSchemaChild } from './normalizeErrorSchema.ts';
import type { ErrorSchema, FormValidation } from './types.ts';

/** Unwraps the `errorHandler` structure into the associated `ErrorSchema`, stripping the `addError()` functions from it
 *
 * @param errorHandler - The `FormValidation` error handling structure
 * @returns - The `ErrorSchema` resulting from the stripping of the `addError()` function
 */
export default function unwrapErrorHandler<T = unknown>(errorHandler: FormValidation<T>): ErrorSchema<T> {
  return unwrapErrors<T>(errorHandler);
}

/** Does the actual unwrapping, walking the entries of a `FormValidation` node so that the recursive call for a nested
 * error handler does not need an assertion back to `FormValidation`. A `customValidate` may hand back an array of the
 * handlers of an array field's items, which is unwrapped into the object keyed by index that `toErrorSchema()` builds
 *
 * @param errors - The error handling structure node, an object or an array of item handlers
 * @returns - The `ErrorSchema` resulting from the stripping of the `addError()` function
 */
function unwrapErrors<T>(errors: Record<string, unknown> | unknown[]): ErrorSchema<T> {
  return Object.entries<unknown>(errors).reduce<ErrorSchema<T>>((acc, [key, childSchema]) => {
    if (key === 'addError') {
      return acc;
    }
    if (isPlainObject(childSchema) || isErrorSchemaChild(key, childSchema)) {
      return {
        ...acc,
        [key]: unwrapErrors<T>(childSchema),
      };
    }
    return { ...acc, [key]: childSchema };
  }, {});
}
