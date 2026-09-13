import { PROPERTIES_KEY, REQUIRED_KEY } from './constants.ts';
import getPropertySchema from './getPropertySchema.ts';
import getSchemaType from './getSchemaType.ts';
import getUiOptions from './getUiOptions.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Recursively walks an object `schema` and its `uiSchema`, returning a new schema with every property marked
 * `ui:required: true` added to the nearest enclosing `required` array. This lets `ui:required` affect schema-level
 * validation (which only consults `required`) without mutating the caller's original schema or uiSchema.
 *
 * Whether a `schema` counts as an object is delegated to `getSchemaType()`, so an object schema with no explicit
 * `type` (inferred from `properties`) or `type: ['object', 'null']` is handled, matching the schema types RJSF
 * itself treats as objects elsewhere. For a multi-type array that doesn't include `'null'` (e.g.
 * `type: ['object', 'string']`), `getSchemaType()` returns only the first entry, so augmentation depends on that
 * array's order — a pre-existing characteristic of `getSchemaType()`, not something specific to this function.
 *
 * @param schema - The schema to augment
 * @param [uiSchema] - The uiSchema, if any, containing the `ui:required` overrides
 * @returns - A new schema with `ui:required` fields folded into `required` arrays, or the original `schema` if
 *          nothing changed
 */
export default function augmentSchemaWithUiRequired<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(schema: S, uiSchema?: UiSchema<T, S, F>): S {
  const properties = schema[PROPERTIES_KEY];
  if (!uiSchema || getSchemaType<S>(schema) !== 'object' || !properties) {
    return schema;
  }

  const existingRequired = schema[REQUIRED_KEY] ?? [];
  const additionalRequired: string[] = [];
  let newProperties = properties;
  let propertiesChanged = false;

  Object.keys(properties).forEach((key) => {
    const fieldUiSchema = uiSchema[key] as UiSchema<T, S, F> | undefined;
    if (!fieldUiSchema) {
      return;
    }
    const { required: uiRequired } = getUiOptions<T, S, F>(fieldUiSchema);
    if (uiRequired === true && !existingRequired.includes(key)) {
      additionalRequired.push(key);
    }

    const propertySchema = getPropertySchema<S>(schema, key);
    const augmentedProperty = augmentSchemaWithUiRequired<T, S, F>(propertySchema, fieldUiSchema);
    if (augmentedProperty !== propertySchema) {
      if (!propertiesChanged) {
        newProperties = { ...properties };
        propertiesChanged = true;
      }
      newProperties[key] = augmentedProperty;
    }
  });

  if (additionalRequired.length === 0 && !propertiesChanged) {
    return schema;
  }

  return {
    ...schema,
    ...(propertiesChanged ? { [PROPERTIES_KEY]: newProperties } : {}),
    ...(additionalRequired.length > 0 ? { [REQUIRED_KEY]: [...existingRequired, ...additionalRequired] } : {}),
  };
}
