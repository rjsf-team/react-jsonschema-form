import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { Radio as UswdsRadio } from '@trussworks/react-uswds';

export default function Radio<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  { id, options, value, required, disabled, readonly, onChange, onBlur, onFocus }: WidgetProps<T, S, F>
) {
  const { enumOptions = [], enumDisabled } = options;

  const _onChange = ({ target: { value: v } }: ChangeEvent<HTMLInputElement>) => onChange(v);
  const _onBlur = ({ target: { value: v } }: FocusEvent<HTMLInputElement>) => onBlur(id, v);
  const _onFocus = ({ target: { value: v } }: FocusEvent<HTMLInputElement>) => onFocus(id, v);

  return (
    <div className="usa-radio-group">
      {enumOptions.map((option, i) => (
        <UswdsRadio
          key={i}
          id={`${id}_${i}`}
          name={id}
          value={option.value}
          checked={option.value === value}
          disabled={enumDisabled && enumDisabled.indexOf(option.value) !== -1}
          label={option.label}
          required={required}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
        />
      ))}
    </div>
  );
}
