import { useCallback } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, ErrorSchema } from '@rjsf/utils';
import { getWidget, getUiOptions, resolveDefaultWidget } from '@rjsf/utils';

/** The `StringField` component is used to render a schema field that represents a string type
 *
 * @param props - The `FieldProps` for this template
 */
function StringField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldProps<T, S, F>,
) {
  const {
    schema,
    name,
    uiSchema,
    fieldPathId,
    formData,
    required,
    disabled = false,
    readonly = false,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
    registry,
    rawErrors,
    hideError,
    title,
  } = props;
  const { title: schemaTitle } = schema;
  const { widgets, schemaUtils, globalUiOptions } = registry;
  const { defaultWidget, enumOptions } = resolveDefaultWidget<T, S, F>(schema, uiSchema, schemaUtils, widgets);
  const { widget = defaultWidget, placeholder = '', title: uiTitle, ...options } = getUiOptions<T, S, F>(uiSchema);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  const label = uiTitle ?? title ?? schemaTitle ?? name;
  // A checkbox can only stand in for a string that has exactly one valid value: checked selects the `const` and
  // unchecked clears the field, so the widget deals in booleans while the form data stays a string
  const constCheckbox = widget === 'checkbox' && typeof schema.const === 'string';
  const Widget = getWidget<T, S, F>(
    schema,
    constCheckbox && !('checkbox' in widgets) ? 'CheckboxWidget' : widget,
    widgets,
  );
  const toFormValue = useCallback(
    (value: any) => {
      if (!constCheckbox) {
        return value;
      }
      return value ? (schema.const as T) : undefined;
    },
    [constCheckbox, schema.const],
  );
  const onWidgetChange = useCallback(
    (value: T | undefined, errorSchema?: ErrorSchema, id?: string) =>
      onChange(toFormValue(value), fieldPathId.path, errorSchema, id),
    [onChange, fieldPathId, toFormValue],
  );
  const onWidgetBlur = useCallback((id: string, value: any) => onBlur(id, toFormValue(value)), [onBlur, toFormValue]);
  const onWidgetFocus = useCallback(
    (id: string, value: any) => onFocus(id, toFormValue(value)),
    [onFocus, toFormValue],
  );
  return (
    <Widget
      options={{ ...options, enumOptions }}
      schema={schema}
      uiSchema={uiSchema}
      id={fieldPathId.$id}
      name={name}
      label={label}
      hideLabel={!displayLabel}
      hideError={hideError}
      value={constCheckbox ? formData === schema.const : formData}
      onChange={onWidgetChange}
      onBlur={onWidgetBlur}
      onFocus={onWidgetFocus}
      required={required}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      registry={registry}
      placeholder={placeholder}
      rawErrors={rawErrors}
      htmlName={fieldPathId.name}
    />
  );
}

export default StringField;
