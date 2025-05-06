import { ChangeEvent, FocusEvent } from 'react';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  enumOptionsValueForIndex,
} from '@rjsf/utils';
import { Select as UswdsSelect } from '@trussworks/react-uswds';

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  multiple,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  schema,
  emptyValue,
}: WidgetProps<T, S, F>) {
  const { enumOptions = [], enumDisabled } = options;

  function _onChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value: eventValue } = event.target;
    if (multiple) {
      const selectedValues = Array.from(event.target.selectedOptions).map((option) =>
        enumOptionsValueForIndex<S>(option.value, enumOptions, emptyValue),
      );
      onChange(selectedValues);
    } else {
      onChange(enumOptionsValueForIndex<S>(eventValue, enumOptions, emptyValue));
    }
  }

  function _onBlur(event: FocusEvent<HTMLSelectElement>) {
    onBlur(id, enumOptionsValueForIndex<S>(event.target.value, enumOptions, emptyValue));
  }

  function _onFocus(event: FocusEvent<HTMLSelectElement>) {
    onFocus(id, enumOptionsValueForIndex<S>(event.target.value, enumOptions, emptyValue));
  }

  const isDisabled = disabled || readonly;

  return (
    <UswdsSelect
      id={id}
      name={id}
      value={typeof value === 'undefined' ? '' : value}
      required={required}
      disabled={isDisabled}
      multiple={multiple}
      onChange={!isDisabled ? _onChange : undefined}
      onBlur={!isDisabled ? _onBlur : undefined}
      onFocus={!isDisabled ? _onFocus : undefined}
    >
      {!multiple && schema.default === undefined && (
        <option value="">{placeholder || 'Select an option'}</option>
      )}
      {enumOptions.map(({ value: optionValue, label }, i) => {
        const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(optionValue);
        return (
          <option key={i} value={optionValue} disabled={itemDisabled}>
            {label}
          </option>
        );
      })}
    </UswdsSelect>
  );
}
