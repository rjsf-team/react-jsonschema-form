import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

interface CustomWidgetOptions {
  color?: string;
}

export default function CustomWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { value, onChange, options } = props;
  const { color } = options as CustomWidgetOptions;

  return (
    <div className='form-control'>
      <input
        type='text'
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className='input input-bordered'
        style={color ? { backgroundColor: color } : undefined}
      />
    </div>
  );
}
