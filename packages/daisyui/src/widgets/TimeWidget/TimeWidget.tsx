import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

const TimeWidget = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) => {
  const { id, value, onChange, required, disabled, readonly } = props;

  return (
    <input
      type='time'
      id={id}
      className='input input-bordered w-full'
      value={value || ''}
      required={required}
      disabled={disabled || readonly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};

export default TimeWidget;
