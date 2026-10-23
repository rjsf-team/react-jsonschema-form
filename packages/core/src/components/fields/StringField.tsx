import { useCallback } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, ErrorSchema } from '@rjsf/utils';
import { fieldPathToName, getUiOptions, resolveWidget } from '@rjsf/utils';

import {
  displaysLabel,
  getWidgetErrorProps,
  getWidgetLabelProps,
  resolveStringFieldWidget,
} from './fieldWidgetUtils.ts';

/** The `StringField` component is used to render a schema field that represents a string type
 *
 * @param props - The `FieldProps` for this template
 */
function StringField<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
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
    // oxlint-disable-next-line typescript/no-deprecated -- handed on to its widget, for one that doesn't read `presentation`
    rawErrors,
    presentation,
    hideError,
    title,
  } = props;
  const { title: schemaTitle } = schema;
  const { widgets, globalUiOptions } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const { widget, enumOptions } = resolveStringFieldWidget<T, S, F>(schema, uiSchema, registry, uiOptions);
  const { widget: _widget, placeholder = '', title: uiTitle, ...options } = uiOptions;
  const labelProps = getWidgetLabelProps<T, S, F>(presentation, uiTitle ?? title ?? schemaTitle ?? name, () =>
    displaysLabel(registry, schema, uiSchema),
  );
  const { Widget } = resolveWidget<T, S, F>(schema, widget, widgets);
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
      {...labelProps}
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
      {...getWidgetErrorProps<T, S, F>(rawErrors)}
      presentation={presentation}
      htmlName={fieldPathToName(fieldPath, registry.globalFormOptions)}
    />
  );
}

export default StringField;
