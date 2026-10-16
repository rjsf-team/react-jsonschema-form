import { ERRORS_KEY } from './constants.ts';
import errorSchemaChild from './errorSchemaChild.ts';
import type { ErrorSchema, RJSFValidationError } from './types.ts';

/** Converts an `errorSchema` into a list of `RJSFValidationErrors`. The errors of an array's items are listed whether
 * the `errorSchema` keys them by index in an object, as `toErrorSchema()` does, or holds them in an array
 *
 * @param errorSchema - The `ErrorSchema` instance to convert
 * @param [fieldPath=[]] - The current field path, defaults to [] if not specified
 * @returns - The list of `RJSFValidationErrors` extracted from the `errorSchema`
 */
export default function toErrorList<T = unknown>(
  errorSchema?: ErrorSchema<T>,
  fieldPath: string[] = [],
): RJSFValidationError[] {
  return errorSchema ? errorsFrom(errorSchema, fieldPath) : [];
}

/** Does the actual conversion, walking the entries of an `ErrorSchema` node so that the recursive call for a nested
 * error schema, an array of item errors included, does not need an assertion back to `ErrorSchema`.
 *
 * @param errorSchema - The error schema node, an object or an array of item errors
 * @param fieldPath - The current field path
 * @returns - The list of `RJSFValidationErrors` extracted from the `errorSchema`
 */
function errorsFrom(errorSchema: Record<string, unknown> | unknown[], fieldPath: string[]): RJSFValidationError[] {
  const errors: unknown = Reflect.get(errorSchema, ERRORS_KEY);
  const property = `.${fieldPath.join('.')}`;
  const errorList: RJSFValidationError[] = Array.isArray(errors)
    ? errors.map((message: string) => ({ property, message, stack: `${property} ${message}` }))
    : [];
  return Object.entries<unknown>(errorSchema).reduce((currentList, [key, childSchema]) => {
    const node = errorSchemaChild(key, childSchema);
    return node ? currentList.concat(errorsFrom(node, [...fieldPath, key])) : currentList;
  }, errorList);
}
