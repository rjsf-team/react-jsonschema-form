import mergeObjects from './mergeObjects.ts';
import toErrorList from './toErrorList.ts';
import type { ErrorSchema, ValidationData } from './types.ts';

/** Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in the
 * two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling
 * `toErrorList()` on the `errors` in the `validationData`. If no `additionalErrorSchema` is passed, then
 * `validationData` is returned.
 *
 * @param validationData - The current `ValidationData` into which to merge the additional errors
 * @param [additionalErrorSchema] - The optional additional set of errors in an `ErrorSchema`
 * @param [preventDuplicates=false] - Optional flag, if true, will call `mergeObjects()` with `preventDuplicates`
 * @returns - The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.
 */
export default function validationDataMerge<T = any>(
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
  if (oldErrorSchema && Object.keys(oldErrorSchema).length > 0) {
    errorSchema = mergeObjects(
      oldErrorSchema,
      additionalErrorSchema,
      preventDuplicates ? 'preventDuplicates' : true,
    ) as ErrorSchema<T>;
    errors = [...oldErrors].concat(errors);
  }
  return { errorSchema, errors };
}
