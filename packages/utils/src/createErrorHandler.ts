import { ERRORS_KEY } from './constants.ts';
import isPlainObject from './isPlainObject.ts';
import type { FieldValidation, FormValidation } from './types.ts';

function buildErrorHandler(formData: unknown): FieldValidation {
  const handler: FieldValidation = {
    // We store the list of errors for this node in a property named __errors
    // to avoid name collision with a possible sub schema field named
    // 'errors' (see `utils.toErrorSchema`).
    [ERRORS_KEY]: [],
    addError(message: string) {
      this[ERRORS_KEY]!.push(message);
    },
  };
  const children: [string, unknown][] =
    Array.isArray(formData) || isPlainObject(formData) ? Object.entries<unknown>(formData) : [];
  return { ...handler, ...Object.fromEntries(children.map(([key, value]) => [key, buildErrorHandler(value)])) };
}

/** Given a `formData` object, recursively creates a `FormValidation` error handling structure around it
 *
 * @param formData - The form data around which the error handler is created
 * @returns - A `FormValidation` object based on the `formData` structure
 */
export default function createErrorHandler<T = unknown>(formData: T): FormValidation<T> {
  // The tree mirrors `formData`'s runtime shape, which the type system cannot follow through `buildErrorHandler`, so
  // this is the one place it is asserted to match `T`
  return buildErrorHandler(formData) as FormValidation<T>;
}
