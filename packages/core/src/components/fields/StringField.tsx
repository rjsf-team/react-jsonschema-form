import { useCallback } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, ErrorSchema } from '@rjsf/utils';
import { fieldPathToName, getUiOptions, getWidget, hasWidget, optionsList } from '@rjsf/utils';

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
    fieldPath,
    id: fieldId,
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
  const { title: schemaTitle, format } = schema;
  const { widgets, schemaUtils, globalUiOptions } = registry;
  const enumOptions = schemaUtils.isSelect(schema) ? optionsList<T, S, F>(schema, uiSchema) : undefined;
  let defaultWidget = enumOptions ? 'select' : 'text';
  if (format && hasWidget<T, S, F>(schema, format, widgets)) {
    defaultWidget = format;
  }
  const { widget = defaultWidget, placeholder = '', title: uiTitle, ...options } = getUiOptions<T, S, F>(uiSchema);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  const label = uiTitle ?? title ?? schemaTitle ?? name;
  const Widget = getWidget<T, S, F>(schema, widget, widgets);
  const onWidgetChange = useCallback(
    (value: T | undefined, errorSchema?: ErrorSchema, id?: string) => onChange(value, fieldPath, errorSchema, id),
    [onChange, fieldPath],
  );
  return (
    <Widget
      options={{ ...options, enumOptions }}
      schema={schema}
      uiSchema={uiSchema}
      id={fieldId}
      name={name}
      label={label}
      hideLabel={!displayLabel}
      hideError={hideError}
      value={formData}
      onChange={onWidgetChange}
      onBlur={onBlur}
      onFocus={onFocus}
      required={required}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      registry={registry}
      placeholder={placeholder}
      rawErrors={rawErrors}
      htmlName={fieldPathToName(fieldPath, registry.globalFormOptions)}
    />
  );
}

export default StringField;
