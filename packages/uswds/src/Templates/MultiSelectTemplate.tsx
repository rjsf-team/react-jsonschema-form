import React from 'react';
import { WidgetProps, EnumOptionsType } from '@rjsf/utils';
import { Select as UswdsSelect } from '@trussworks/react-uswds';

// Assuming this is intended to be a Widget, using WidgetProps
export default function MultiSelectTemplate(props: WidgetProps) {
  const {
    schema,
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
    // placeholder, // Placeholder typically not used for multi-select
    // rawErrors = [],
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { target } = event;
    const selectedValues = Array.from(target.selectedOptions).map(
      (option: HTMLOptionElement) => option.value,
    );
    // RJSF expects array for multi-select
    onChange(selectedValues);
  };

  const _onBlur = ({ target }: React.FocusEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(target.selectedOptions).map(
      (option: HTMLOptionElement) => option.value,
    );
    onBlur(id, selectedValues);
  };

  const _onFocus = ({ target }: React.FocusEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(target.selectedOptions).map(
      (option: HTMLOptionElement) => option.value,
    );
    onFocus(id, selectedValues);
  };

  // Ensure value is an array
  const selectValue = Array.isArray(value)
    ? value
    : value !== undefined && value !== null
    ? [String(value)]
    : [];

  return (
    <UswdsSelect
      id={id}
      name={id}
      value={selectValue} // Pass array value
      required={required}
      multiple={true} // Set multiple to true
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={!readonly ? _onBlur : undefined}
      onFocus={!readonly ? _onFocus : undefined}
      onChange={!readonly ? _onChange : undefined}
    >
      {(enumOptions as EnumOptionsType[]).map(
        ({ value: optionValue, label: optionLabel }: EnumOptionsType, i: number) => {
          const disabledOpt = enumDisabled && enumDisabled.includes(optionValue);
          return (
            <option key={i} value={optionValue} disabled={disabledOpt}>
              {optionLabel}
            </option>
          );
        },
      )}
    </UswdsSelect>
  );
}
