import { RJSFSchema, UiSchema } from './types';
import getUiOptions from './getUiOptions';

export default function canExpand<T = any, F = any>(schema: RJSFSchema, uiSchema: UiSchema<T, F>, formData: T) {
  if (!schema.additionalProperties) {
    return false;
  }
  const { expandable = true } = getUiOptions<T, F>(uiSchema);
  if (expandable === false) {
    return expandable;
  }
  // if ui:options.expandable was not explicitly set to false, we can add
  // another property if we have not exceeded maxProperties yet
  if (schema.maxProperties !== undefined) {
    return Object.keys(formData).length < schema.maxProperties;
  }
  return true;
}
