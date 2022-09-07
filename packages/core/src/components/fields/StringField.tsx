import React from "react";
import {
  getWidget,
  getUiOptions,
  optionsList,
  hasWidget,
  FieldProps,
} from "@rjsf/utils";

/** The `StringField` component is used to render a schema field that represents a string type
 *
 * @param props - The `FieldProps` for this template
 */
function StringField<T = any, F = any>(props: FieldProps<T, F>) {
  const {
    schema,
    name,
    uiSchema,
    idSchema,
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
  } = props;
  const { title, format } = schema;
  const { widgets, formContext, schemaUtils } = registry;
  const enumOptions = schemaUtils.isSelect(schema)
    ? optionsList(schema)
    : undefined;
  let defaultWidget = enumOptions ? "select" : "text";
  if (format && hasWidget<T, F>(schema, format, widgets)) {
    defaultWidget = format;
  }
  const {
    widget = defaultWidget,
    placeholder = "",
    ...options
  } = getUiOptions<T, F>(uiSchema);
  const Widget = getWidget<T, F>(schema, widget, widgets);
  return (
    <Widget
      options={{ ...options, enumOptions }}
      schema={schema}
      uiSchema={uiSchema}
      id={idSchema && idSchema.$id}
      label={title === undefined ? name : title}
      value={formData}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      required={required}
      disabled={disabled}
      readonly={readonly}
      formContext={formContext}
      autofocus={autofocus}
      registry={registry}
      placeholder={placeholder}
      rawErrors={rawErrors}
    />
  );
}

export default StringField;
