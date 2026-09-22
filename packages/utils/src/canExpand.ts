import getUiOptions from './getUiOptions.ts';
import isObject from './isObject.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Checks whether the field described by `schema`, having the `uiSchema` and `formData` supports expanding. The UI for
 * the field can expand if it has additional properties, is not forced as non-expandable by the `uiSchema`, the
 * `formData` object doesn't already have `schema.maxProperties` elements and the names `schema.propertyNames`
 * enumerates are not all taken.
 *
 * @param schema - The schema for the field that is being checked
 * @param [uiSchema={}] - The uiSchema for the field
 * @param [formData] - The formData for the field
 * @returns - True if the schema element has additionalProperties, is expandable, is not at the maxProperties limit and
 *          has an allowed property name left to take
 */
export default function canExpand<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  schema: RJSFSchema,
  uiSchema: UiSchema<T, S, F> = {},
  formData?: T,
) {
  if (!(schema.additionalProperties || schema.patternProperties)) {
    return false;
  }
  const { expandable = true } = getUiOptions<T, S, F>(uiSchema);
  if (expandable === false) {
    return expandable;
  }
  // A `propertyNames.enum` caps the object the way `maxProperties` does, one level of indirection away: once every
  // name it allows is taken, a new property could only be added under a name the schema forbids. A name the schema
  // declares as a property of its own is taken however empty its value is, and a name the `formData` holds is taken
  // whether or not `retrieveSchema()` has stubbed it in among the properties. Both caps have to hold, so this one
  // only rules expansion out; the `maxProperties` limit below still gets to rule on the names that are left
  const { propertyNames } = schema;
  if (isObject(propertyNames) && Array.isArray(propertyNames.enum)) {
    const allowedNames = propertyNames.enum.filter((allowedName) => typeof allowedName === 'string');
    if (allowedNames.length > 0) {
      const properties = schema.properties ?? {};
      const takenNames = isObject(formData) ? formData : {};
      const hasNameLeft = allowedNames.some(
        (allowedName) => !Object.hasOwn(properties, allowedName) && !Object.hasOwn(takenNames, allowedName),
      );
      if (!hasNameLeft) {
        return false;
      }
    }
  }
  // if ui:options.expandable was not explicitly set to false, we can add
  // another property if we have not exceeded maxProperties yet
  if (schema.maxProperties !== undefined && formData) {
    return Object.keys(formData).length < schema.maxProperties;
  }
  return true;
}
