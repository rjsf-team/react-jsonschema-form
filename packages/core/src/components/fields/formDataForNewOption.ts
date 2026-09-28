import type { FormContextType, GenericObjectType, RJSFSchema, SchemaUtilsType, StrictRJSFSchema } from '@rjsf/utils';
import { CONST_KEY, DEFAULT_KEY, deepEquals, getPropertySchema, isPlainObject } from '@rjsf/utils';

/** Determines whether `option` declares a value of its own for `key`, meaning the fill at the end of
 * `formDataForNewOption()` will put something there once the key is out of the way. Only a declared `default` or
 * `const` counts: the computed defaults also contain a nested object's leaf defaults, `[]` for a required array and
 * `false` for a required boolean, none of which is the option saying what the key should hold.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to resolve the property schema with
 * @param option - The option whose property declaration is being tested
 * @param key - The name of the property to test
 * @returns - True when the option declares a `default` or `const` for `key`
 */
function optionDeclaresValueFor<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  option: S,
  key: string,
): boolean {
  const propertySchema = schemaUtils.retrieveSchema(getPropertySchema<S>(option, key));
  return DEFAULT_KEY in propertySchema || CONST_KEY in propertySchema;
}

/** Computes the form data to carry across a switch from `oldOption` to `newOption` of a `oneOf`/`anyOf`.
 *
 * `sanitizeDataForNewSchema()` drops what the new option cannot hold, and `getDefaultFormState()` fills in what it
 * declares, but neither lets the new option's `default` reach a key that already holds something, so a value the old
 * option's `default` put there survives the switch and switching back no longer restores it
 * ([#4476](https://github.com/rjsf-team/react-jsonschema-form/issues/4476)). The same happens to a key whose value
 * sanitize discarded, because it clears by assigning `undefined` rather than by removing the key, and
 * `getDefaultFormState()` populates an absent key but leaves one explicitly set to `undefined` alone. Deleting either
 * kind of key outright is what lets the fill below reach it.
 *
 * A key sanitize cleared is only deleted when it held a value for sanitize to discard. `Form` reads an option's data
 * consisting only of `undefined` values as a switch away from a `null` option and recomputes the defaults from the
 * root schema, which is the only way a default declared above the option can be restored; filling one of those keys
 * here would take that away without being able to replace it. Being absent is not an exemption in itself: the old
 * defaults hold `undefined` for a property the old option declares without a default of its own, so an absent key
 * matches them and the new option's default does reach it.
 *
 * A key is only deleted when `newOption` declares a `default` or `const` for it, so the fill is certain to put
 * something back. A value equal to the old default cannot be told apart from one the user or the caller supplied that
 * happens to equal it, and the computed defaults say more than the option declares — they also carry a nested
 * object's leaf defaults, `[]` for a required array and `false` for a required boolean — so deleting on either of
 * those would strand data that used to survive the switch.
 *
 * Staleness is judged against `formData` as it arrived, not against the sanitized copy: sanitize rewrites a nested
 * value whenever the two options declare different properties for it, adding an `undefined` key for one the new
 * option drops and a leaf default for one it adds, and the rewritten value no longer resembles the default it came
 * from. The old defaults use `excludeObjectChildren`, the flag the fill below uses, so the two describe the same
 * thing; computing them any other way makes them disagree under an `experimental_defaultFormStateBehavior` that
 * suppresses object defaults. They describe what an earlier switch through here wrote, which is the case this is
 * for, rather than every default the form holds — `Form` fills the root with `includeUndefinedValues: false`. That
 * divergence only stops a key from matching, so the worst it costs is that the replacement does not happen.
 *
 * Values are matched whole, per top-level key of the option: editing one leaf of a nested object leaves the whole
 * subtree in place, so its other leaves keep the old option's defaults.
 *
 * @param schemaUtils - The `SchemaUtilsType` implementation to compute the defaults and sanitize the data with
 * @param formData - The form data associated with `oldOption`
 * @param [newOption] - The option being switched to, or undefined when the selection is being cleared
 * @param [oldOption] - The option being switched away from, if one was selected
 * @returns - The form data for `newOption`, or undefined when it holds nothing, as when the selection is cleared
 */
export default function formDataForNewOption<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(schemaUtils: SchemaUtilsType<T, S, F>, formData: T | undefined, newOption?: S, oldOption?: S): T | undefined {
  let newFormData = schemaUtils.sanitizeDataForNewSchema(newOption, oldOption, formData);
  if (newOption && isPlainObject(newFormData)) {
    const sanitizedData = newFormData as GenericObjectType;
    const oldData: GenericObjectType = isPlainObject(formData) ? (formData as GenericObjectType) : {};
    const oldDefaults = oldOption
      ? schemaUtils.getDefaultFormState(oldOption, undefined, 'excludeObjectChildren')
      : undefined;
    const oldDefaultsData: GenericObjectType = isPlainObject(oldDefaults) ? (oldDefaults as GenericObjectType) : {};
    const withoutBlockedKeys: GenericObjectType = { ...sanitizedData };
    Object.keys(sanitizedData).forEach((key) => {
      const wasClearedBySanitize = sanitizedData[key] === undefined && oldData[key] !== undefined;
      const holdsOldDefault = key in oldDefaultsData && deepEquals(oldDefaultsData[key], oldData[key]);
      if ((wasClearedBySanitize || holdsOldDefault) && optionDeclaresValueFor(schemaUtils, newOption, key)) {
        delete withoutBlockedKeys[key];
      }
    });
    newFormData = withoutBlockedKeys as T;
  }
  if (newOption) {
    // Call getDefaultFormState to make sure defaults are populated on change. Pass "excludeObjectChildren"
    // so that only the root objects themselves are created without adding undefined children properties
    newFormData = schemaUtils.getDefaultFormState(newOption, newFormData, 'excludeObjectChildren') as T;
  }
  return newFormData;
}
