import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { Select as UswdsSelect } from '@trussworks/react-uswds';

export default function Select<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  { id, options, value, required, disabled, readonly, multiple, onChange, onBlur, onFocus }: WidgetProps<T, S, F>
) {
  const { enumOptions = [], enumDisabled } = options;

  const _onChange = ({ target: { value: v } }: ChangeEvent<HTMLSelectElement>) => onChange(v);
  const _onBlur = ({ target: { value: v } }: FocusEvent<HTMLSelectElement>) => onBlur(id, v);
  const _onFocus = ({ target: { value: v } }: FocusEvent<HTMLSelectElement>) => onFocus(id, v);

  return (
    <UswdsSelect
      id={id}
      name={id}
      value={value}
      required={required}
      disabled={disabled || readonly}
      multiple={multiple}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    >
      {enumOptions.map(({ value, label }, i) => (
        <option key={i} value={value} disabled={enumDisabled && enumDisabled.indexOf(value) !== -1}>
          {label}
        </option>
      ))}
    </UswdsSelect>
  );
}
