import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { examplesId, getControlAttributes, getExampleSuggestions, getInputProps } from '@rjsf/utils';
import { Input, InputNumber } from 'antd';

import getControlState from '../../controlState.ts';

const INPUT_STYLE = {
  width: '100%',
};

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    registry,
    id,
    htmlName,
    onBlur,
    onChange,
    onChangeOverride,
    onFocus,
    options,
    placeholder,
    readonly,
    required,
    schema,
    value,
    type,
    presentation,
  } = props;
  // InputNumber doesn't use a native <input type="number"> directly - it wraps it and controls the stepping behavior
  // through its own props. The step prop in Ant Design expects a number, not the string "any"
  const inputProps = getInputProps<T, S, F>(schema, type, options, false);
  const control = getControlState<T, S, F>({ disabled, readonly, registry });
  const { ClearButton } = registry.templates.ButtonTemplates;

  const handleNumberChange = (nextValue: number | null) => onChange(nextValue ?? options.emptyValue);

  const handleTextChange =
    onChangeOverride ??
    (({ target }: ChangeEvent<HTMLInputElement>) => onChange(target.value === '' ? options.emptyValue : target.value));

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

  const handleClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue);
    },
    [onChange, options.emptyValue],
  );

  const { min, max, ...restInputProps } = inputProps;

  // `InputNumber` reports only the parsed value, never the `ChangeEvent` an `onChangeOverride` is declared to
  // receive, so a widget that supplies one gets the plain input every other theme renders for a numeric field.
  const isNumeric = !onChangeOverride && (inputProps.type === 'number' || inputProps.type === 'integer');

  const exampleSuggestions = getExampleSuggestions<S>(schema);
  const hasExamples = exampleSuggestions.length > 0;
  const controlAttributes = getControlAttributes<T, S, F>({ id, presentation }, hasExamples ? [examplesId(id)] : []);
  const input = isNumeric ? (
    <InputNumber
      autoFocus={autofocus}
      disabled={control.disabled}
      id={id}
      name={htmlName || id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleNumberChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      readOnly={readonly}
      required={required}
      style={INPUT_STYLE}
      changeOnWheel={false}
      list={hasExamples ? examplesId(id) : undefined}
      {...restInputProps}
      min={typeof min === 'number' ? min : undefined}
      max={typeof max === 'number' ? max : undefined}
      type={undefined}
      value={value}
      {...controlAttributes}
    />
  ) : (
    <Input
      autoFocus={autofocus}
      disabled={control.disabled}
      id={id}
      name={htmlName || id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleTextChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      readOnly={readonly}
      required={required}
      style={INPUT_STYLE}
      list={hasExamples ? examplesId(id) : undefined}
      {...inputProps}
      value={value}
      {...controlAttributes}
    />
  );

  return (
    <>
      {input}
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton registry={registry} onClick={handleClear} />
      )}
      <SchemaExamples id={id} schema={schema} suggestions={exampleSuggestions} />
    </>
  );
}
