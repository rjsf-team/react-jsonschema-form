import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

const CheckboxesWidget = <T, S extends StrictRJSFSchema, F extends FormContextType>({
  id,
  disabled,
  options,
  value,
  readonly,
  required,
  onChange,
}: WidgetProps<T, S, F>) => {
  const { enumOptions } = options;
  const isEnumeratedObject = enumOptions && enumOptions[0]?.value && typeof enumOptions[0].value === 'object';

  const isChecked = (option: any) => {
    if (!Array.isArray(value)) {
      return false;
    }
    if (isEnumeratedObject) {
      return value.some((v) => v.name === option.value.name);
    }
    return value.includes(option.value);
  };

  const _onChange = (option: any) => {
    const newValue = Array.isArray(value) ? [...value] : [];
    const optionValue = isEnumeratedObject ? option.value : option.value;

    if (isChecked(option)) {
      onChange(newValue.filter((v) => (isEnumeratedObject ? v.name !== optionValue.name : v !== optionValue)));
    } else {
      onChange([...newValue, optionValue]);
    }
  };

  return (
    <div className='form-control'>
      {enumOptions?.map((option) => (
        <label key={option.value} className='cursor-pointer label my-auto mr-4'>
          <input
            type='checkbox'
            id={`${id}-${option.value}`}
            className='checkbox'
            name={id}
            checked={isChecked(option)}
            required={required}
            disabled={disabled || readonly}
            onChange={() => _onChange(option)}
          />
          <span className='label-text'>{option.label}</span>
        </label>
      ))}
    </div>
  );
};

export default CheckboxesWidget;
