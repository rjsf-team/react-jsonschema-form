import { RJSFSchema, UiSchema } from './types';
import getUiOptions from './getUiOptions';

/** Checks as to whether the field described by `schema`, having the `uiSchema` and `formData` supports expanding. The
 * UI for the field can expand if it has additional properties, is not forced as non-expandable by the `uiSchema` and
 * the `formData` object doesn't already have `schema.maxProperties` elements.
 *
 * @param schema - The schema for the field that is being checked
 * @param [uiSchema={}] - The uiSchema for the field
 * @param [formData] - The formData for the field
 * @returns - True if the schema element has additionalProperties, is expandable, and not at the maxProperties limit
 */
export default function canExpand<T = any, F = any>(schema: RJSFSchema, uiSchema: UiSchema<T, F> = {}, formData?: T) {
  if (!schema.additionalProperties) {
    return false;
  }
  const { expandable = true } = getUiOptions<T, F>(uiSchema);
  if (expandable === false) {
    return expandable;
  }
  // if ui:options.expandable was not explicitly set to false, we can add
  // another property if we have not exceeded maxProperties yet
  if (schema.maxProperties !== undefined && formData) {
    return Object.keys(formData).length < schema.maxProperties;
  }
  return true;
}
