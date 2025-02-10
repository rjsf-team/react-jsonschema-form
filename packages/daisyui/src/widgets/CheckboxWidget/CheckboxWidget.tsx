import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { id, value, required, disabled, readonly, onChange, label } = props;
  console.log('DaisyUI CheckboxWidget');
  return (
    <div className='form-control'>
      <label htmlFor={id} className='label cursor-pointer'>
        <input
          type='checkbox'
          id={id}
          value={value}
          required={required}
          disabled={disabled || readonly}
          onChange={(event) => onChange(event.target.checked)}
          className='checkbox checkbox-primary'
        />
        <span className='label-text'>{label}</span>
      </label>
    </div>
  );
}
