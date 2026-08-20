import isEmpty from 'lodash/isEmpty';

import { ERRORS_KEY } from './constants';
import isObject from './isObject';
import mergeObjects from './mergeObjects';
import toErrorList from './toErrorList';
import type { ErrorSchema, GenericObjectType, ValidationData } from './types';

/** Recursively rewrites any array found in an `ErrorSchema` (other than the `__errors` message list) into a plain
 * object keyed by index. RJSF's own AJV-derived `ErrorSchema`s always represent per-index array item sub-schemas as
 * plain numeric-keyed objects, never as real arrays. `additionalErrorSchema`, however, can arrive with real arrays
 * at those same paths (e.g. `ArrayField`'s add/copy/remove/reorder handlers build their optimistic `newErrorSchema`
 * with lodash's `set()`, which auto-vivifies real arrays for numeric path segments). `mergeObjects()` treats a real
 * array and a same-path numeric-keyed object as incompatible shapes and overwrites the whole branch rather than
 * merging it, silently dropping real validation errors. Normalizing first keeps both sides in the same shape so the
 * merge recurses correctly.
 *
 * Returns the original `errorSchema` reference whenever nothing needed rewriting (no array was found anywhere in the
 * sub-tree), only allocating new objects along the path to a change. Some call sites rely on `additionalErrorSchema`
 * being returned by reference when unchanged (e.g. `Form` sometimes mutates `customErrors.ErrorSchema` in place and
 * relies on that being visible through a previously-shared `state.errorSchema` reference), so this must not force a
 * new object identity when the input already matches RJSF's own indexed-object convention.
 *
 * @param errorSchema - The `ErrorSchema` (or sub-tree) to normalize
 * @returns - An equivalent `ErrorSchema` where every non-`__errors` array has been converted to an indexed object
 */
function normalizeErrorSchemaArrays<T = any>(errorSchema: ErrorSchema<T>): ErrorSchema<T> {
  if (Array.isArray(errorSchema)) {
    return errorSchema.reduce((acc: GenericObjectType, value, index) => {
      acc[index] = normalizeErrorSchemaArrays(value);
      return acc;
    }, {}) as ErrorSchema<T>;
  }
  if (!isObject(errorSchema)) {
    return errorSchema;
  }
  let changed = false;
  const result: GenericObjectType = {};
  Object.keys(errorSchema).forEach((key) => {
    const value = (errorSchema as GenericObjectType)[key];
    const normalizedValue = key === ERRORS_KEY ? value : normalizeErrorSchemaArrays(value);
    if (normalizedValue !== value) {
      changed = true;
    }
    result[key] = normalizedValue;
  });
  return (changed ? result : errorSchema) as ErrorSchema<T>;
}

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
  const normalizedAdditionalErrorSchema = normalizeErrorSchemaArrays(additionalErrorSchema);
  const { errors: oldErrors, errorSchema: oldErrorSchema } = validationData;
  let errors = toErrorList(normalizedAdditionalErrorSchema);
  let errorSchema = normalizedAdditionalErrorSchema;
  if (!isEmpty(oldErrorSchema)) {
    errorSchema = mergeObjects(
      oldErrorSchema,
      normalizedAdditionalErrorSchema,
      preventDuplicates ? 'preventDuplicates' : true,
    ) as ErrorSchema<T>;
    errors = [...oldErrors].concat(errors);
  }
  return { errorSchema, errors };
}
