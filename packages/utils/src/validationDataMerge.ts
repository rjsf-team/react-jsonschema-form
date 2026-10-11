import { ERRORS_KEY } from './constants.ts';
import isPlainObject from './isPlainObject.ts';
import mergeObjects from './mergeObjects.ts';
import toErrorList from './toErrorList.ts';
import type { ErrorSchema, ValidationData } from './types.ts';

/** A copy of `additionalErrorSchema` without the messages that `errorSchema` already holds under the same keys, which
 * are the ones `mergeObjects()` with `preventDuplicates` leaves out of the merged `ErrorSchema`. Listing this copy
 * rather than `additionalErrorSchema` keeps the `errors` list in step with the merged `ErrorSchema`: an additional
 * error is left out of both or listed where the merge shows it. Matching on the `ErrorSchema` rather than on the
 * `property` of the existing errors also means any spelling of a path (`foo`, `.foo`, `.arr[0]`, `.arr.0`, `''` or `.`
 * for the root) matches, since `toErrorSchema()` has already split it into keys.
 *
 * @param additionalErrorSchema - The additional errors, viewed as the plain object they are at runtime
 * @param errorSchema - The node of the existing `ErrorSchema` at the same keys, if there is one
 * @returns - A copy of `additionalErrorSchema` without the messages `errorSchema` already holds
 */
function withoutMergedErrors(additionalErrorSchema: Record<string, unknown>, errorSchema: unknown) {
  const existing = isPlainObject(errorSchema) ? errorSchema : {};
  // Without a prototype, so that a `__proto__` key is copied as a plain key
  const kept: Record<string, unknown> = Object.create(null);
  for (const key of Object.keys(additionalErrorSchema)) {
    const value = additionalErrorSchema[key];
    const existingValue = Object.hasOwn(existing, key) ? existing[key] : undefined;
    if (key === ERRORS_KEY && Array.isArray(value) && Array.isArray(existingValue)) {
      kept[key] = value.filter((message) => !existingValue.includes(message));
    } else if (isPlainObject(value)) {
      kept[key] = withoutMergedErrors(value, existingValue);
    } else {
      kept[key] = value;
    }
  }
  return kept;
}

/** Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in the
 * two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling
 * `toErrorList()` on the `errors` in the `validationData`. If no `additionalErrorSchema` is passed, or an empty one,
 * then `validationData` is returned. The existing `errors` are always kept, also when their `errorSchema` is empty, as
 * it is when a `transformErrors` clears every `message`.
 *
 * @param validationData - The current `ValidationData` into which to merge the additional errors
 * @param [additionalErrorSchema] - The optional additional set of errors in an `ErrorSchema`
 * @param [preventDuplicates=false] - Optional flag, if true, will call `mergeObjects()` with `preventDuplicates` and
 * leave out of the appended errors those it leaves out of the merged `ErrorSchema`: the messages the existing
 * `errorSchema` already holds under the same keys
 * @returns - The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.
 */
export default function validationDataMerge<T = unknown>(
  validationData: ValidationData<T>,
  additionalErrorSchema?: ErrorSchema<T>,
  preventDuplicates = false,
): ValidationData<T> {
  if (!additionalErrorSchema || Object.keys(additionalErrorSchema).length === 0) {
    return validationData;
  }
  const { errors: oldErrors, errorSchema: oldErrorSchema } = validationData;
  const errors = toErrorList(
    preventDuplicates
      ? (withoutMergedErrors(additionalErrorSchema, oldErrorSchema) as ErrorSchema<T>)
      : additionalErrorSchema,
  );
  let errorSchema = additionalErrorSchema;
  if (oldErrorSchema && Object.keys(oldErrorSchema).length > 0) {
    errorSchema = mergeObjects(
      oldErrorSchema,
      additionalErrorSchema,
      preventDuplicates ? 'preventDuplicates' : true,
    ) as ErrorSchema<T>;
  }
  return { errorSchema, errors: [...oldErrors, ...errors] };
}
