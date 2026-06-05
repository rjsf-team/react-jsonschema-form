import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
} from '@rjsf/utils';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { multiple = false } = props;

  return multiple ? <MultiSelectWidget {...props} /> : <SingleSelectWidget {...props} />;
}

function SingleSelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  schema,
  id,
  htmlName,
  name, // remove this from dropdownProps
  options,
  label,
  hideLabel,
  required,
  disabled,
  placeholder,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  errorSchema,
  rawErrors = [],
  registry,
  uiSchema,
  hideError,
  ...dropdownProps
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const primeProps = (options.prime || {}) as object;

  const isMultiple = typeof multiple === 'undefined' ? false : multiple;

  const emptyValue = isMultiple ? [] : '';

  const handleChange = (e: { value: any }) =>
    onChange(enumOptionValueDecoder<S>(e.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, optEmptyVal));
  const { ...dropdownRemainingProps } = dropdownProps;

  return (
    <Dropdown
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={enumOptionSelectedValue<S>(value, enumOptions, isMultiple, optionValueFormat, emptyValue)}
      options={(enumOptions ?? []).map(({ value: enumValue, label: enumLabel }, i: number) => ({
        label: enumLabel,
        value: enumOptionValueEncoder(enumValue, i, optionValueFormat),
        disabled: Array.isArray(enumDisabled) && enumDisabled.includes(enumValue),
      }))}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      aria-describedby={ariaDescribedByIds(id)}
      {...dropdownRemainingProps}
    />
  );
}

function MultiSelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  htmlName,
  options,
  disabled,
  placeholder,
  readonly,
  value,
  multiple = false,
  autofocus,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const primeProps = (options.prime || {}) as object;

  const emptyValue = multiple ? [] : '';

  const handleChange = (e: { value: any }) =>
    onChange(enumOptionValueDecoder<S>(e.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, optEmptyVal));
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, optionValueFormat, optEmptyVal));

  return (
    <MultiSelect
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={enumOptionSelectedValue<S>(value, enumOptions, multiple, optionValueFormat, emptyValue)}
      options={(enumOptions ?? []).map(({ value: enumValue, label: enumLabel }, i: number) => ({
        label: enumLabel,
        value: enumOptionValueEncoder(enumValue, i, optionValueFormat),
        disabled: Array.isArray(enumDisabled) && enumDisabled.includes(enumValue),
      }))}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      display={options.display === 'chip' ? 'chip' : 'comma'}
      aria-describedby={ariaDescribedByIds(id)}
      pt={{ root: { style: { position: 'relative' } } }}
    />
  );
}
