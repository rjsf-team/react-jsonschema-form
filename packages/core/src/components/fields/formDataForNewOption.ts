import type { FormContextType, GenericObjectType, RJSFSchema, SchemaUtilsType, StrictRJSFSchema } from '@rjsf/utils';
import { deepEquals, isPlainObject } from '@rjsf/utils';

/** Computes the form data to carry across a switch from `oldOption` to `newOption` of a `oneOf`/`anyOf`.
 *
 * `sanitizeDataForNewSchema()` drops what the new option cannot hold, and `getDefaultFormState()` fills in what it
 * declares, but neither removes a value the old option's own `default` put there: the key still holds data, so the
 * new option's default never gets the chance to replace it, and switching back to an option no longer restores it
 * ([#4476](https://github.com/rjsf-team/react-jsonschema-form/issues/4476)). Comparing each key against the default
 * the old option would have produced identifies those values, and deleting them is what lets the fill below reach
 * them — `getDefaultFormState()` populates an absent key, but leaves one explicitly set to `undefined` alone.
 *
 * Only a key the new option itself defaults is deleted. A value matching the old default cannot be told apart from
 * one the user or the caller supplied that happens to equal it, so removing a key the fill below would not restore
 * would lose data that used to survive the switch.
 *
 * Both computations pass `excludeObjectChildren`, the flag the fill uses, so that the comparison is made against the
 * same defaults the form itself wrote; computing them any other way makes the two disagree under an
 * `experimental_defaultFormStateBehavior` that suppresses object defaults.
 *
 * Values are matched whole, per top-level key of the option: editing one leaf of a nested object leaves the whole
 * subtree in place, so its other leaves keep the old option's defaults.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to compute the defaults and sanitize the data with
 * @param formData - The form data associated with `oldOption`
 * @param [newOption] - The option being switched to, or undefined when the selection is being cleared
 * @param [oldOption] - The option being switched away from, if one was selected
 * @returns - The form data for `newOption`
 */
export default function formDataForNewOption<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(schemaUtils: SchemaUtilsType<T, S, F>, formData: T | undefined, newOption?: S, oldOption?: S): T {
  let newFormData = schemaUtils.sanitizeDataForNewSchema(newOption, oldOption, formData);
  if (newOption && oldOption && isPlainObject(newFormData)) {
    const oldDefaults = schemaUtils.getDefaultFormState(oldOption, undefined, 'excludeObjectChildren');
    const newDefaults = schemaUtils.getDefaultFormState(newOption, undefined, 'excludeObjectChildren');
    if (isPlainObject(oldDefaults) && isPlainObject(newDefaults)) {
      const withoutStaleDefaults: GenericObjectType = { ...(newFormData as GenericObjectType) };
      Object.keys(oldDefaults).forEach((key) => {
        if (
          (newDefaults as GenericObjectType)[key] !== undefined &&
          deepEquals((oldDefaults as GenericObjectType)[key], withoutStaleDefaults[key])
        ) {
          delete withoutStaleDefaults[key];
        }
      });
      newFormData = withoutStaleDefaults as T;
    }
  }
  if (newOption) {
    // Call getDefaultFormState to make sure defaults are populated on change. Pass "excludeObjectChildren"
    // so that only the root objects themselves are created without adding undefined children properties
    newFormData = schemaUtils.getDefaultFormState(newOption, newFormData, 'excludeObjectChildren') as T;
  }
  return newFormData;
}
