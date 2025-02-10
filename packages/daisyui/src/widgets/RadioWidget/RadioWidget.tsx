import { WidgetProps, StrictRJSFSchema, FormContextType } from '@rjsf/utils';

const RadioWidget = <T, S extends StrictRJSFSchema, F extends FormContextType>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  onChange,
}: WidgetProps<T, S, F>) => {
  const { enumOptions } = options;
  const isEnumeratedObject = enumOptions && enumOptions[0]?.value && typeof enumOptions[0].value === 'object';

  const getValue = (option: any) => {
    if (isEnumeratedObject) {
      return option.value;
    }
    return option.value;
  };

  const isChecked = (option: any) => {
    if (isEnumeratedObject) {
      return value && value.name === option.value.name;
    }
    return value === option.value;
  };

  return (
    <div className='form-control'>
      {enumOptions?.map((option) => (
        <label key={option.value} className='cursor-pointer label my-auto mr-4'>
          <input
            type='radio'
            id={`${id}-${option.value}`}
            className='radio'
            name={id}
            value={getValue(option)}
            checked={isChecked(option)}
            required={required}
            disabled={disabled || readonly}
            onChange={(e) => {
              onChange(isEnumeratedObject ? option.value : option.value);
              e.target.blur();
            }}
          />
          <span className='label-text'>{option.label}</span>
        </label>
      ))}
    </div>
  );
};

export default RadioWidget;
