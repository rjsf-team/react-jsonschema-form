import { FocusEvent } from 'react';
import { Dropdown } from 'primereact/dropdown';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
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
  const useRealValues = !!options.useRealOptionValues;
  const primeProps = (options.prime || {}) as object;

  multiple = typeof multiple === 'undefined' ? false : multiple;

  const emptyValue = multiple ? [] : '';

  const _onChange = (e: { value: any }) =>
    onChange(enumOptionValueDecoder<S>(e.value, enumOptions, useRealValues, optEmptyVal));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, optEmptyVal));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, optEmptyVal));
  const { ...dropdownRemainingProps } = dropdownProps;

  return (
    <Dropdown
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={enumOptionSelectedValue<S>(value, enumOptions, !!multiple, useRealValues, emptyValue)}
      options={(enumOptions ?? []).map(({ value, label }, i: number) => ({
        label,
        value: enumOptionValueEncoder(value, i, useRealValues),
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
      }))}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
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
  const useRealValues = !!options.useRealOptionValues;
  const primeProps = (options.prime || {}) as object;

  const emptyValue = multiple ? [] : '';

  const _onChange = (e: { value: any }) =>
    onChange(enumOptionValueDecoder<S>(e.value, enumOptions, useRealValues, optEmptyVal));
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, optEmptyVal));
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, optEmptyVal));

  return (
    <MultiSelect
      id={id}
      name={htmlName || id}
      {...primeProps}
      value={enumOptionSelectedValue<S>(value, enumOptions, multiple, useRealValues, emptyValue)}
      options={(enumOptions ?? []).map(({ value, label }, i: number) => ({
        label,
        value: enumOptionValueEncoder(value, i, useRealValues),
        disabled: Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1,
      }))}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      placeholder={placeholder}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      display={options.display === 'chip' ? 'chip' : 'comma'}
      aria-describedby={ariaDescribedByIds(id)}
      pt={{ root: { style: { position: 'relative' } } }}
    />
  );
}
