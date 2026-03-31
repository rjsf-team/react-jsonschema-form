import get from 'lodash/get';

import getUiOptions from './getUiOptions';
import { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types';

/** Recursively walks a schema and uiSchema, adding fields marked `ui:required: true` to the schema's `required`
 * arrays. Returns a new schema without mutating the original.
 *
 * @param schema - The schema to augment
 * @param [uiSchema] - The uiSchema containing ui:required overrides
 * @returns A new schema with ui:required fields added to required arrays
 */
export default function augmentSchemaWithUiRequired<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(schema: S, uiSchema?: UiSchema<T, S, F>): S {
  if (!uiSchema || schema.type !== 'object' || !schema.properties) {
    return schema;
  }

  const existingRequired = schema.required || [];
  const additionalRequired: string[] = [];
  let propertiesChanged = false;
  const newProperties: Record<string, unknown> = {};

  for (const key of Object.keys(schema.properties)) {
    const fieldUiSchema = get(uiSchema, [key]);
    const propertySchema = schema.properties[key] as S;

    if (fieldUiSchema) {
      const { required: uiRequired } = getUiOptions<T, S, F>(fieldUiSchema);
      if (uiRequired === true && !existingRequired.includes(key)) {
        additionalRequired.push(key);
      }
    }

    // Recurse into nested objects
    if (propertySchema && propertySchema.type === 'object' && fieldUiSchema) {
      const augmented = augmentSchemaWithUiRequired<T, S, F>(propertySchema, fieldUiSchema);
      if (augmented !== propertySchema) {
        propertiesChanged = true;
        newProperties[key] = augmented;
        continue;
      }
    }
    newProperties[key] = propertySchema;
  }

  if (additionalRequired.length === 0 && !propertiesChanged) {
    return schema;
  }

  return {
    ...schema,
    ...(propertiesChanged ? { properties: newProperties } : {}),
    ...(additionalRequired.length > 0 ? { required: [...existingRequired, ...additionalRequired] } : {}),
  };
}
