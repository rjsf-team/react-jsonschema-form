import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { id, value, required, disabled, readonly, onChange, label } = props;
  console.log('DaisyUI BaseInputTemplate');
  return (
    <div className='form-control'>
      <label htmlFor={id} className='label hidden' style={{ display: 'none' }}>
        <span className='label-text'>{label}</span>
      </label>
      <input
        type='text'
        id={id}
        value={value}
        required={required}
        disabled={disabled || readonly}
        onChange={(event) => onChange(event.target.value)}
        className='input input-bordered'
      />
    </div>
  );
}
