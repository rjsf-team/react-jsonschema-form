import { RJSF_REF_CYCLE_KEY } from './constants.ts';
import getDeprecatedHandling from './getDeprecatedHandling.ts';
import getUiOptions from './getUiOptions.ts';
import isFieldHidden from './isFieldHidden.ts';
import resolveUiSchema from './resolveUiSchema.ts';
import { expandRefCycle } from './schema/retrieveSchema.ts';
import type { FormContextType, Registry, RJSFMarkedSchema, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Tells whether the `SchemaField` rendered with `schema`, `uiSchema` and `formData` hides its field, resolving them as
 * `SchemaField` does, so a container laying out a field it has not rendered yet, such as `ObjectField` for its
 * `ObjectFieldTemplate`, agrees with the field's `FieldTemplate`. A `$ref` cycle renders an Expand button, which hides
 * nothing, until it is expanded, and then the field one level further
 *
 * @param schema - The field's schema, as the container hands it to `SchemaField`
 * @param uiSchema - The field's uiSchema, as the container hands it to `SchemaField`
 * @param formData - The field's data
 * @param registry - The registry
 * @param [expanded=false] - Whether the field is a `$ref` cycle the user has expanded
 * @returns - True when the field renders hidden
 */
export default function isSchemaFieldHidden<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  formData: T | undefined,
  registry: Registry<T, S, F>,
  expanded = false,
): boolean {
  const { schemaUtils, globalUiOptions } = registry;
  let fieldSchema = schema;
  if ((schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]) {
    if (!expanded) {
      return false;
    }
    fieldSchema = expandRefCycle<S>(schema, schemaUtils.getRootSchema());
  }
  const ownUiOptions = getUiOptions<T, S, F>(resolveUiSchema<T, S, F>(fieldSchema, uiSchema, registry));
  const uiOptions = { ...globalUiOptions, ...ownUiOptions };
  // Only a `'hide'` handling reads the retrieved schema, so the retrieval is skipped otherwise
  const deprecatedHandling =
    uiOptions.deprecatedHandling === 'hide'
      ? getDeprecatedHandling<T, S, F>(schemaUtils.retrieveSchema(fieldSchema, formData), uiOptions)
      : undefined;
  return isFieldHidden<T, S, F>(ownUiOptions, deprecatedHandling);
}
