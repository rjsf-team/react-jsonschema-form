import getFreePropertyNames from './getFreePropertyNames.ts';
import getUiOptions from './getUiOptions.ts';
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
  // name it allows is taken, a new property could only be added under a name the schema forbids. Both caps have to
  // hold, so this one only rules expansion out; the `maxProperties` limit below still gets to rule on the names left
  if (getFreePropertyNames<T>(schema, formData)?.length === 0) {
    return false;
  }
  // if ui:options.expandable was not explicitly set to false, we can add
  // another property if we have not exceeded maxProperties yet
  if (schema.maxProperties !== undefined && formData) {
    return Object.keys(formData).length < schema.maxProperties;
  }
  return true;
}
