import {
  getWidget,
  getUiOptions,
  optionsList,
  hasWidget,
  FieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `StringField` component is used to render a schema field that represents a string type
 *
 * @param props - The `FieldProps` for this template
 */
function StringField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldProps<T, S, F>
) {
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
    hideError,
  } = props;
  const { title, format } = schema;
  const { widgets, formContext, schemaUtils, globalUiOptions } = registry;
  const enumOptions = schemaUtils.isSelect(schema) ? optionsList<S, T, F>(schema, uiSchema) : undefined;
  let defaultWidget = enumOptions ? 'select' : 'text';
  if (format && hasWidget<T, S, F>(schema, format, widgets)) {
    defaultWidget = format;
  }
  const { widget = defaultWidget, placeholder = '', title: uiTitle, ...options } = getUiOptions<T, S, F>(uiSchema);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);
  const label = uiTitle ?? title ?? name;
  const Widget = getWidget<T, S, F>(schema, widget, widgets);
  return (
    <Widget
      options={{ ...options, enumOptions }}
      schema={schema}
      uiSchema={uiSchema}
      id={idSchema.$id}
      name={name}
      label={label}
      hideLabel={!displayLabel}
      hideError={hideError}
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
