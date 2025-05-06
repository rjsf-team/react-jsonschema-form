import React from 'react';
import { WidgetProps, EnumOptionsType } from '@rjsf/utils'; // Import EnumOptionsType
import { Select as UswdsSelect } from '@trussworks/react-uswds';

export default function SelectTemplate(props: WidgetProps) {
  // Renamed to SelectTemplate
  const {
    schema,
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    multiple = false,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    // rawErrors = [], // Not typically used directly in select widget
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Get event object
    const { target } = event; // Destructure target from event
    // Handle multiple select
    if (multiple) {
      // Use target here
      const selectedValues = Array.from(target.selectedOptions).map(
        (option: HTMLOptionElement) => option.value,
      ); // Added type annotation
      onChange(selectedValues);
    } else {
      onChange(target.value === '' ? emptyValue || '' : target.value);
    }
  };
  const _onBlur = ({ target: { value: targetValue } }: React.FocusEvent<HTMLSelectElement>) =>
    onBlur(id, targetValue === '' ? emptyValue || '' : targetValue);
  const _onFocus = ({ target: { value: targetValue } }: React.FocusEvent<HTMLSelectElement>) =>
    onFocus(id, targetValue === '' ? emptyValue || '' : targetValue);

  // Ensure value is correctly formatted for multiple select
  const selectValue =
    multiple && !Array.isArray(value)
      ? value !== undefined && value !== null
        ? [String(value)]
        : []
      : value;

  return (
    <UswdsSelect
      id={id}
      name={id}
      value={selectValue ?? (multiple ? [] : '')}
      required={required}
      multiple={multiple}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={!readonly ? _onBlur : undefined}
      onFocus={!readonly ? _onFocus : undefined}
      onChange={!readonly ? _onChange : undefined}
    >
      {/* Add placeholder option if not multiple and placeholder exists */}
      {!multiple && schema.default === undefined && placeholder && (
        <option value="">{placeholder}</option>
      )}
      {/* Map enumOptions to <option> tags */}
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

// You might need separate MultiSelect.tsx and OneOfField.tsx files
// that import and use this SelectTemplate or adapt its logic.
// For now, this addresses the errors in SelectTemplate.tsx itself.
// If MultiSelect.tsx and OneOfField.tsx exist, they need similar refactoring.
