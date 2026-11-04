import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import { TextInput, NumberInput } from '@mantine/core';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import {
  examplesId,
  getControlAttributes,
  getExampleSuggestions,
  callerInputProps,
  getBaseInputProps,
  labelValue,
  numericWidgetStoresString,
  offersClearButton,
  toInputValue,
  widgetDrawsLabel,
} from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../utils.tsx';

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    htmlName,
    schema,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    options,
    children,
    registry,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { ClearButton } = registry.templates.ButtonTemplates;

  // Mantine's `NumberInput` reports only the parsed value, never the `ChangeEvent` an `onChangeOverride` is declared
  // to receive, and sets an `inputMode` of its own over any it is given, so a widget that names either gets the plain
  // input every other theme renders for a numeric field.
  const plainInput = Boolean(onChangeOverride) || 'inputMode' in props;
  const inputProps = getBaseInputProps<T, S, F>(props, plainInput);
  // `ui:options` spreads onto the input as Mantine props, so the props a widget passes go after it to win
  const themeProps = {
    ...cleanupOptions(options, props),
    ...callerInputProps(props),
    multiple: inputProps.multiple,
  };
  const descriptionProps = getDescriptionProps(props);

  // `NumberInput` reports a number once its text parses as one, and on blur trims leading zeroes by parsing the text,
  // which rounds the digits past a number's precision, so a string field turns that trim off and gets a string back
  const storesString = numericWidgetStoresString<S>(schema, value);
  const handleNumberChange = useCallback(
    (newValue: number | string) => {
      if (newValue === '') {
        onChange(options.emptyValue);
      } else {
        onChange(storesString ? String(newValue) : newValue);
      }
    },
    [onChange, storesString, options.emptyValue],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value === '' ? options.emptyValue : e.target.value);
    },
    [onChange, options.emptyValue],
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      onBlur(id, e.target?.value);
    },
    [onBlur, id],
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      onFocus(id, e.target?.value);
    },
    [onFocus, id],
  );

  const handleClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue);
    },
    [onChange, options.emptyValue],
  );

  const inputValue = toInputValue(value);
  const exampleSuggestions = getExampleSuggestions<S>(schema);
  const hasExamples = exampleSuggestions.length > 0;
  const componentProps = {
    id,
    name: htmlName || id,
    label: labelValue(label || undefined, hideLabel, false),
    required,
    autoFocus: autofocus,
    disabled: disabled || readonly,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
    placeholder,
    error: getWidgetError<T, S, F>(props),
    list: hasExamples ? examplesId(id) : undefined,
  };

  const { min, max, ...restInputProps } = inputProps;

  const isNumeric = !plainInput && (inputProps.type === 'number' || inputProps.type === 'integer');

  const ariaDescribedByProps = useInputAriaProps<T, S, F>(
    isNumeric ? 'NumberInput' : 'TextInput',
    props,
    getControlAttributes<T, S, F>(props, hasExamples ? [examplesId(id)] : []),
  );

  const input = isNumeric ? (
    <NumberInput
      onChange={!readonly ? handleNumberChange : undefined}
      {...componentProps}
      {...restInputProps}
      {...themeProps}
      step={typeof inputProps.step === 'number' ? inputProps.step : 1}
      {...(storesString && { trimLeadingZeroesOnBlur: false })}
      type='text'
      {...ariaDescribedByProps}
      {...descriptionProps}
      value={inputValue}
      min={typeof min === 'number' ? min : undefined}
      max={typeof max === 'number' ? max : undefined}
    />
  ) : (
    <TextInput
      onChange={!readonly ? (onChangeOverride ?? handleChange) : undefined}
      {...componentProps}
      {...inputProps}
      {...themeProps}
      {...ariaDescribedByProps}
      {...descriptionProps}
      value={inputValue}
    />
  );

  // `NumberInput` is a text input that shows a partial number such as `5.` or `-`, which a native number input blanks
  const showsValue = isNumeric
    ? (typeof value === 'number' || typeof value === 'string') && Boolean(inputValue)
    : offersClearButton(inputValue, inputProps.type);

  return (
    <>
      {input}
      {options.allowClearTextInputs && !readonly && !disabled && showsValue && (
        <ClearButton registry={registry} onClick={handleClear} />
      )}
      {children}
      <SchemaExamples id={id} schema={schema} suggestions={exampleSuggestions} />
    </>
  );
}
