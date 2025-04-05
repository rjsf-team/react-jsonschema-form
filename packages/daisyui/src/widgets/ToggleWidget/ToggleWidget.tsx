import { ChangeEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

export default function ToggleWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ id, value, required, disabled, readonly, autofocus, onChange, options }: WidgetProps<T, S, F>) {
  const _onChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => onChange(checked);
  const { size = 'md' } = options;

  const sizeClass = size !== 'md' ? `toggle-${size}` : '';

  return (
    <div className='form-control'>
      <label className='cursor-pointer label my-auto'>
        <input
          type='checkbox'
          id={id}
          checked={value}
          required={required}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onChange={_onChange}
          className={`toggle ${sizeClass}`}
        />
        <span className='label-text'>{options.label}</span>
      </label>
    </div>
  );
}
