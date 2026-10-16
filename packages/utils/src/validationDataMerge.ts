import isPlainObject from './isPlainObject.ts';
import mergeObjects from './mergeObjects.ts';
import normalizeErrorSchema from './normalizeErrorSchema.ts';
import toErrorList from './toErrorList.ts';
import type { ErrorSchema, ValidationData } from './types.ts';

/** A copy of `additionalErrorSchema` without the array entries that `errorSchema` already holds under the same keys,
 * which is what `mergeObjects()` with `preventDuplicates` leaves out of a merge. Both the `errors` list and the merged
 * `ErrorSchema` are built from this copy, so an additional error is left out of both or listed where its field shows
 * it. Matching on the `ErrorSchema` rather than on the `property` of the existing errors also means any spelling of a
 * path (`foo`, `.foo`, `.arr[0]`, `.arr.0`, `''` or `.` for the root) matches, since `toErrorSchema()` has already split
 * it into keys.
 *
 * Accepted edge case: the validators file an invalid-schema error under `$schema`, which is also where a property named
 * `$schema` keeps its errors. An additional error there that reads the same as the invalid-schema message is left out of
 * the list, so that property's field shows it while the only listed copy is the invalid-schema error, whose missing
 * `property` points at no field. Keeping one rule for the list and the `ErrorSchema` is worth that.
 *
 * @param additionalErrorSchema - The additional errors, viewed as the plain object they are at runtime
 * @param errorSchema - The node of the existing `ErrorSchema` at the same keys
 * @returns - A copy of `additionalErrorSchema` without the array entries `errorSchema` already holds
 */
function withoutMergedErrors(additionalErrorSchema: Record<string, unknown>, errorSchema: Record<string, unknown>) {
  // Without a prototype, so that a `__proto__` key is copied as a plain key
  const kept: Record<string, unknown> = Object.create(null);
  for (const key of Object.keys(additionalErrorSchema)) {
    const value = additionalErrorSchema[key];
    const existingValue = Object.hasOwn(errorSchema, key) ? errorSchema[key] : undefined;
    if (Array.isArray(value) && Array.isArray(existingValue)) {
      kept[key] = value.filter((message) => !existingValue.includes(message));
    } else if (isPlainObject(value) && isPlainObject(existingValue)) {
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
 * it is when a `transformErrors` clears every `message`. An array either `ErrorSchema` holds for the items of an array
 * field is merged as the object keyed by index that `toErrorSchema()` builds, so it neither replaces the other's errors
 * for those items nor is appended to an array of them.
 *
 * @param validationData - The current `ValidationData` into which to merge the additional errors
 * @param [additionalErrorSchema] - The optional additional set of errors in an `ErrorSchema`
 * @param [preventDuplicates=false] - Optional flag, if true, leaves out of both the merged `ErrorSchema` and the appended
 * errors the messages the existing `errorSchema` already holds under the same keys
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
  let additional = normalizeErrorSchema(additionalErrorSchema);
  let errorSchema = additional;
  if (oldErrorSchema && Object.keys(oldErrorSchema).length > 0) {
    const existing = normalizeErrorSchema(oldErrorSchema);
    // One copy drives both the merged `ErrorSchema` and the list, so they cannot disagree on what is a duplicate
    if (preventDuplicates) {
      additional = withoutMergedErrors(additional, existing) as ErrorSchema<T>;
    }
    errorSchema = mergeObjects(existing, additional, true) as ErrorSchema<T>;
  }
  const errors = toErrorList(additional);
  return { errorSchema, errors: [...oldErrors, ...errors] };
}
