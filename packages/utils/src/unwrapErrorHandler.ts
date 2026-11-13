import errorSchemaChild from './errorSchemaChild.ts';
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
 * handlers of an array field's items, which is unwrapped into the object keyed by index that `toErrorSchema()` builds.
 * A `null` or `undefined` child, such as the entry such an array holds for an item without errors, is left out, as
 * `toErrorSchema()` never builds one and a merge would otherwise let it replace the other `ErrorSchema`'s node there.
 * What sits under `__errors` is a leaf, as every other walk of an `ErrorSchema` reads it
 *
 * @param errors - The error handling structure node, an object or an array of item handlers
 * @returns - The `ErrorSchema` resulting from the stripping of the `addError()` function
 */
function unwrapErrors<T>(errors: Record<string, unknown> | unknown[]): ErrorSchema<T> {
  return Object.entries<unknown>(errors).reduce<ErrorSchema<T>>((acc, [key, childSchema]) => {
    if (key === 'addError' || childSchema == null) {
      return acc;
    }
    const node = errorSchemaChild(key, childSchema);
    if (node) {
      return {
        ...acc,
        [key]: unwrapErrors<T>(node),
      };
    }
    return { ...acc, [key]: childSchema };
  }, {});
}
