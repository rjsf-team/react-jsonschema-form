import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { Checkbox } from '@trussworks/react-uswds';

export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  disabled,
  options,
  value = [],
  readonly,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions = [], enumDisabled, inline } = options;

  function _onChange(index: number) {
    return function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const { checked } = event.target;
      const all = (enumOptions || []).map((option) => option.value);
      if (checked) {
        onChange([...value, all[index]]);
      } else {
        onChange(value.filter((v: any) => v !== all[index]));
      }
    };
  }

  function _onBlur(event: FocusEvent<HTMLInputElement>) {
    onBlur(id, event.target.value);
  }

  function _onFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus(id, event.target.value);
  }

  return (
    <div className={`usa-checkbox-group ${inline ? 'display-flex flex-wrap' : ''}`} id={id}>
      {enumOptions.map((option, index: number) => {
        const checked = value.includes(option.value);
        const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
        const checkboxId = `${id}_${index}`;

        return (
          <Checkbox
            key={index}
            id={checkboxId}
            name={`${id}[]`} // Use array notation for name
            label={option.label}
            checked={checked}
            disabled={disabled || itemDisabled || readonly}
            onChange={!readonly ? _onChange(index) : undefined}
            onBlur={!readonly ? _onBlur : undefined}
            onFocus={!readonly ? _onFocus : undefined}
            className={inline ? 'margin-right-2 margin-bottom-1' : ''}
          />
        );
      })}
    </div>
  );
}
