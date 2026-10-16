import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UIOptionsType, UiSchema } from '@rjsf/utils';
import { getByPath, UI_FIELD_KEY, UI_OPTIONS_KEY } from '@rjsf/utils';

/** Looks up what a `ui:field` refers to: the value registered under it when it is a name, otherwise the `ui:field`
 * itself. `getByPath()` reads own properties only, so a name such as `constructor` or `toString` resolves to nothing
 * rather than to something off `Object.prototype`, which rendered as a component threw "Objects are not valid as a
 * React child"
 *
 * @param field - The `field` from the UI options
 * @param fields - The registered fields
 * @returns - The value the `ui:field` refers to, which is not necessarily a component
 */
export function lookUpUiField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(field: UIOptionsType<T, S, F>['field'], fields: Registry<T, S, F>['fields']): unknown {
  return typeof field === 'string' ? getByPath(fields, field) : field;
}

/** Whether a named field is one `SchemaField` renders the data through when no field is named: `SchemaField` itself,
 * or `FallbackField`, which it renders for a type no other field takes. Neither is a field written for the schema, so
 * naming one leaves the label and the field's frame as they are when the schema's type picks the field
 *
 * @param field - What the `ui:field`, `ui:globalOptions.field` or `$id` refers to
 * @param fields - The registered fields
 * @returns - Whether the field is `SchemaField` or `FallbackField`
 */
export function isSchemaFieldOwn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(field: unknown, fields: Registry<T, S, F>['fields']): boolean {
  return field === fields.SchemaField || field === fields.FallbackField;
}

/** Returns `uiSchema` with the field it names shadowed in each spelling, for what renders at the same data path as the
 * named field: shadowed rather than deleted, since `getUiOptions()` layers a `ui:globalOptions.field` under the local
 * entry, so deleting the local one alone leaves the global showing through
 *
 * @param uiSchema - The field's `uiSchema`
 * @param globalField - The `field` from `ui:globalOptions`
 * @returns - `uiSchema` itself when nothing names a field, else a copy naming none
 */
export function withoutNamedField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F>, globalField: UIOptionsType<T, S, F>['field']): UiSchema<T, S, F> {
  if (uiSchema[UI_FIELD_KEY] === undefined && uiSchema[UI_OPTIONS_KEY]?.field === undefined && !globalField) {
    return uiSchema;
  }
  const shadowedUiSchema: UiSchema<T, S, F> = {
    ...uiSchema,
    [UI_OPTIONS_KEY]: { ...uiSchema[UI_OPTIONS_KEY], field: undefined },
  };
  delete shadowedUiSchema[UI_FIELD_KEY];
  return shadowedUiSchema;
}
