import mergeObjects from './mergeObjects.ts';
import { toPath } from './pathUtils.ts';
import toErrorList from './toErrorList.ts';
import type { ErrorSchema, RJSFValidationError, ValidationData } from './types.ts';

/** The key under which an error counts as the same as another: the path its `property` addresses, split the way
 * `toErrorSchema()` splits it (which is how `mergeObjects()` keys the `ErrorSchema` it merges), and its message. The
 * validators, `toErrorList()` and a `customValidate()` or `transformErrors()` do not spell one location alike (`foo`,
 * `.foo`, `.arr[0]`, `.arr.0`, `''` and `.` for the root), so the raw `property` string cannot be compared
 *
 * @param error - The error to key
 * @returns - The key made of the error's path and message
 */
function errorKey({ property, message }: RJSFValidationError): string {
  return JSON.stringify([property ? toPath(property) : [], message]);
}

/** Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in the
 * two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling
 * `toErrorList()` on the `errors` in the `validationData`. If no `additionalErrorSchema` is passed, then
 * `validationData` is returned.
 *
 * @param validationData - The current `ValidationData` into which to merge the additional errors
 * @param [additionalErrorSchema] - The optional additional set of errors in an `ErrorSchema`
 * @param [preventDuplicates=false] - Optional flag, if true, will call `mergeObjects()` with `preventDuplicates` and
 * skip additional errors already in the existing errors list (same path and `message`, whatever way the `property`
 * spells the path)
 * @returns - The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.
 */
export default function validationDataMerge<T = unknown>(
  validationData: ValidationData<T>,
  additionalErrorSchema?: ErrorSchema<T>,
  preventDuplicates = false,
): ValidationData<T> {
  if (!additionalErrorSchema) {
    return validationData;
  }
  const { errors: oldErrors, errorSchema: oldErrorSchema } = validationData;
  let errors = toErrorList(additionalErrorSchema);
  let errorSchema = additionalErrorSchema;
  if ((oldErrorSchema && Object.keys(oldErrorSchema).length > 0) || oldErrors.length > 0) {
    errorSchema = mergeObjects(
      oldErrorSchema,
      additionalErrorSchema,
      preventDuplicates ? 'preventDuplicates' : true,
    ) as ErrorSchema<T>;
    if (preventDuplicates) {
      const known = new Set(oldErrors.map(errorKey));
      errors = errors.filter((error) => !known.has(errorKey(error)));
    }
    errors = [...oldErrors].concat(errors);
  }
  return { errorSchema, errors };
}
