import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { id, value, required, disabled, readonly, onChange } = props;
  console.log('DaisyUI TextareaWidget');
  return (
    <div className='form-control'>
      <textarea
        id={id}
        value={value}
        required={required}
        disabled={disabled || readonly}
        onChange={(event) => onChange(event.target.value)}
        className='textarea'
      />
    </div>
  );
}
