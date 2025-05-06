import React from 'react';
import { WidgetProps, EnumOptionsType } from '@rjsf/utils'; // Assuming it acts like a widget
import { Select as UswdsSelect } from '@trussworks/react-uswds';

// Assuming this template acts as a widget to select the 'oneOf' option index
export default function OneOfFieldTemplate(props: WidgetProps) {
  const {
    id,
    options, // Contains enumOptions for the oneOf selection
    value, // Current selected index (or undefined)
    required,
    disabled,
    readonly,
    autofocus = false,
    onChange,
    onBlur,
    onFocus,
    // schema, // Schema might be complex here
    // placeholder,
    // rawErrors = [],
  } = props;
  const { enumOptions, emptyValue } = options; // enumOptions here represent the oneOf choices

  const _onChange = ({ target: { value: targetValue } }: React.ChangeEvent<HTMLSelectElement>) => {
    // onChange likely expects the index or a value representing the chosen schema
    onChange(targetValue === '' ? emptyValue || '' : targetValue);
  };
  const _onBlur = ({ target: { value: targetValue } }: React.FocusEvent<HTMLSelectElement>) =>
    onBlur(id, targetValue === '' ? emptyValue || '' : targetValue);
  const _onFocus = ({ target: { value: targetValue } }: React.FocusEvent<HTMLSelectElement>) =>
    onFocus(id, targetValue === '' ? emptyValue || '' : targetValue);

  return (
    <UswdsSelect
      id={id}
      name={id}
      value={value ?? ''} // Use current value or empty string
      required={required}
      multiple={false} // oneOf selection is single choice
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={!readonly ? _onBlur : undefined}
      onFocus={!readonly ? _onFocus : undefined}
      onChange={!readonly ? _onChange : undefined}
    >
      {/* Add a default empty option? */}
      <option value="">{options.placeholder || 'Select option'}</option>
      {(enumOptions as EnumOptionsType[]).map(
        ({ value: optionValue, label: optionLabel }: EnumOptionsType, i: number) => {
          // Assuming optionValue might be the index or a specific identifier
          return (
            <option key={i} value={optionValue}>
              {optionLabel}
            </option>
          );
        },
      )}
    </UswdsSelect>
  );
}
