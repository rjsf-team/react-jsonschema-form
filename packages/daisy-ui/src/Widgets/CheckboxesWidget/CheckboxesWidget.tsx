import {
  WidgetProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  ariaDescribedByIds,
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  optionId,
} from '@rjsf/utils';

export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { id, options, value = [], required, disabled, readonly, onChange } = props;
  const { enumOptions, enumDisabled } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    const newValue = [...checkboxesValues];

    if (checked && enumOptions) {
      if (!newValue.includes(enumOptions[index].value)) {
        newValue.push(enumOptions[index].value);
      }
    } else if (enumOptions) {
      const valueIndex = newValue.indexOf(enumOptions[index].value);
      if (valueIndex >= 0) {
        newValue.splice(valueIndex, 1);
      }
    }
    onChange(newValue);
  };

  return (
    <div className='form-control' aria-describedby={ariaDescribedByIds<T>(id)}>
      {enumOptions?.map((option, index) => {
        const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
        const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;

        return (
          <label key={index} className='cursor-pointer label'>
            <input
              type='checkbox'
              id={optionId(id, index)}
              name={id}
              checked={checked}
              required={required}
              disabled={disabled || itemDisabled || readonly}
              onChange={handleChange(index)}
              className='checkbox'
            />
            <span className='label-text'>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
