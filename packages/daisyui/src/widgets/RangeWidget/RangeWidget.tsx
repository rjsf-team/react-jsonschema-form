import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

const RangeWidget = <T, S extends StrictRJSFSchema, F extends FormContextType>({
  id,
  value,
  required,
  disabled,
  readonly,
  onChange,
  schema,
}: WidgetProps<T, S, F>) => {
  return (
    <div className='form-control'>
      <input
        type='range'
        id={id}
        className='range'
        value={value || schema.default}
        required={required}
        disabled={disabled || readonly}
        min={schema.minimum}
        max={schema.maximum}
        step={schema.multipleOf || 1}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className='label-text ml-4'>{value}</span>
    </div>
  );
};

export default RangeWidget;
