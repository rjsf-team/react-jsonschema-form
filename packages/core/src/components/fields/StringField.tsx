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
  const Widget = getWidget<T, S, F>(schema, widget, widgets);
  const onWidgetChange = useCallback(
    (value: T | undefined, errorSchema?: ErrorSchema, id?: string) =>
      onChange(value, fieldPathId.path, errorSchema, id),
    [onChange, fieldPathId],
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
      htmlName={fieldPathId.name}
    />
  );
}

export default StringField;
