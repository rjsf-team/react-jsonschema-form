import { useCallback } from 'react';
import type { FieldProps, FormContextType, ErrorSchema, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { fieldPathToName, getUiOptions, optionsList, resolveWidget, TranslatableString } from '@rjsf/utils';

import {
  booleanListsConstantOptions,
  getBooleanFieldWidget,
  getWidgetErrorProps,
  getWidgetLabelProps,
} from './fieldWidgetUtils.ts';

/** The `BooleanField` component is used to render a field in the schema is boolean. It constructs `enumOptions` for the
 * two boolean values based on the various alternatives in the schema.
 *
 * @param props - The `FieldProps` for this template
 */
function BooleanField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    schema,
    name,
    uiSchema,
    fieldPath,
    id: fieldId,
    formData,
    registry,
    required,
    disabled,
    readonly,
    hideError,
    autofocus,
    title,
    onChange,
    onFocus,
    onBlur,
    // oxlint-disable-next-line typescript/no-deprecated -- handed on to its widget, for one that doesn't read `presentation`
    rawErrors,
    presentation,
  } = props;
  const { title: schemaTitle } = schema;
  const { widgets, translateString, globalUiOptions } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const {
    widget: _widget,
    title: uiTitle,
    // Unlike the other fields, don't use `getDisplayLabel()` since it always returns false for the boolean type
    label: displayLabel = true,
    // Applied through the `enumOptions` it labels, and ignored by constant options, so a widget mustn't apply it again
    enumNames: _enumNames,
    placeholder,
    ...options
  } = uiOptions;
  const { Widget } = resolveWidget<T, S, F>(schema, getBooleanFieldWidget<T, S, F>(uiOptions), widgets);
  const yes = translateString(TranslatableString.YesLabel);
  const no = translateString(TranslatableString.NoLabel);
  const labelProps = getWidgetLabelProps<T, S, F>(
    presentation,
    uiTitle ?? schemaTitle ?? title ?? name,
    () => displayLabel,
  );
  // The label `optionsList()` falls back to for a value nothing else names; any other value is labelled with itself
  const yesNoLabel = (value: unknown) => {
    if (typeof value !== 'boolean') {
      return undefined;
    }
    return value ? yes : no;
  };
  // Read from the keyword `SchemaField` picks the widget from, so the widget and the options come from one list
  const enumOptions = booleanListsConstantOptions<S>(schema)
    ? // Without the `enum`, which `optionsList()` would list instead
      optionsList<T, S, F>({ ...schema, enum: undefined }, uiSchema, yesNoLabel)
    : optionsList<T, S, F>({ enum: schema.enum ?? [true, false] } as S, uiSchema, yesNoLabel);
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
      onChange={onWidgetChange}
      onFocus={onFocus}
      onBlur={onBlur}
      {...labelProps}
      value={formData}
      // The plan's, which a checkbox the schema lets be `false` is not, so a widget written for any theme submits it
      // unchecked (#5388). Its control's own, since a label drawn above carries the marker of the field it labels
      required={presentation?.control ? presentation.control.attributes.required === true : required}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      registry={registry}
      autofocus={autofocus}
      placeholder={placeholder}
      {...getWidgetErrorProps<T, S, F>(rawErrors)}
      presentation={presentation}
      htmlName={fieldPathToName(fieldPath, registry.globalFormOptions)}
    />
  );
}

export default BooleanField;
