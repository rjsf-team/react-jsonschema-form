import { useCallback } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, ErrorSchema } from '@rjsf/utils';
import { DEFAULT_BOOLEAN_WIDGET, fieldPathToName, getUiOptions, resolveWidget } from '@rjsf/utils';

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
  // Matched by the component, so a widget the form registers under the `checkbox` key is handed the string
  const confirmsConst = typeof schema.const === 'string' && Widget === widgets[DEFAULT_BOOLEAN_WIDGET];
  const toFormValue = useCallback(
    (value: unknown) => {
      if (!confirmsConst) {
        return value;
      }
      return value ? schema.const : undefined;
    },
    [confirmsConst, schema.const],
  );
  const onWidgetChange = useCallback(
    (value: T | undefined, errorSchema?: ErrorSchema, id?: string) =>
      onChange(toFormValue(value), fieldPath, errorSchema, id),
    [onChange, fieldPath, toFormValue],
  );
  const onWidgetBlur = useCallback(
    (id: string, value: unknown) => onBlur(id, toFormValue(value)),
    [onBlur, toFormValue],
  );
  const onWidgetFocus = useCallback(
    (id: string, value: unknown) => onFocus(id, toFormValue(value)),
    [onFocus, toFormValue],
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
      value={confirmsConst ? formData === schema.const : formData}
      onChange={onWidgetChange}
      onBlur={onWidgetBlur}
      onFocus={onWidgetFocus}
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
