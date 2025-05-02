import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

export default function Range<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  { id, value, disabled, readonly, onChange, onBlur, onFocus, options }: WidgetProps<T, S, F>
) {
  const _onChange = ({ target: { value: v } }: ChangeEvent<HTMLInputElement>) => onChange(v);
  const _onBlur = ({ target: { value: v } }: FocusEvent<HTMLInputElement>) => onBlur(id, v);
  const _onFocus = ({ target: { value: v } }: FocusEvent<HTMLInputElement>) => onFocus(id, v);

  return (
    <input
      type="range"
      className="usa-range"
      id={id}
      name={id}
      value={value || ''}
      min={Number(options.min) || 0}
      max={Number(options.max) || 100}
      step={Number(options.step) || 1}
      disabled={disabled || readonly}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}
