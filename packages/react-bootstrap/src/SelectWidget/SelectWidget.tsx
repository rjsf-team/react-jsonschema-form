import { ChangeEvent, FocusEvent } from 'react';
import FormSelect from 'react-bootstrap/FormSelect';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIndexForValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  schema,
  id,
  htmlName,
  options,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  rawErrors = [],
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyValue } = options;

  const emptyValue = multiple ? [] : '';
  const useRealValues = !!options.useRealOptionValues;

  function getValue(event: FocusEvent | ChangeEvent | any, multiple?: boolean) {
    if (multiple) {
      return [].slice
        .call(event.target.options as any)
        .filter((o: any) => o.selected)
        .map((o: any) => o.value);
    } else {
      return event.target.value;
    }
  }
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  const showPlaceholderOption = !multiple && schema.default === undefined;

  let selectValue;
  if (useRealValues) {
    const isEmpty =
      typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);
    if (isEmpty) {
      selectValue = emptyValue;
    } else {
      selectValue = multiple ? value.map(String) : String(value);
    }
  } else {
    selectValue = typeof selectedIndexes === 'undefined' ? emptyValue : selectedIndexes;
  }

  return (
    <FormSelect
      id={id}
      name={htmlName || id}
      value={selectValue}
      required={required}
      multiple={multiple}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      className={rawErrors.length > 0 ? 'is-invalid' : ''}
      onBlur={
        onBlur &&
        ((event: FocusEvent) => {
          const newValue = getValue(event, multiple);
          onBlur(id, enumOptionValueDecoder<S>(newValue, enumOptions, useRealValues, optEmptyValue));
        })
      }
      onFocus={
        onFocus &&
        ((event: FocusEvent) => {
          const newValue = getValue(event, multiple);
          onFocus(id, enumOptionValueDecoder<S>(newValue, enumOptions, useRealValues, optEmptyValue));
        })
      }
      onChange={(event: ChangeEvent) => {
        const newValue = getValue(event, multiple);
        onChange(enumOptionValueDecoder<S>(newValue, enumOptions, useRealValues, optEmptyValue));
      }}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {showPlaceholderOption && <option value=''>{placeholder}</option>}
      {(enumOptions as any).map(({ value, label }: any, i: number) => {
        const disabled: any = Array.isArray(enumDisabled) && (enumDisabled as any).indexOf(value) != -1;
        return (
          <option key={i} id={label} value={enumOptionValueEncoder(value, i, useRealValues)} disabled={disabled}>
            {label}
          </option>
        );
      })}
    </FormSelect>
  );
}
