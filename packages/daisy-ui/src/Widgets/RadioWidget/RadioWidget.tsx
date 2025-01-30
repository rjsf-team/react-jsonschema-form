import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { options, value, required, disabled, readonly, onChange, id } = props;
  const { enumOptions, enumDisabled } = options;

  return (
    <div className='flex flex-col gap-4'>
      {enumOptions?.map((option, i) => {
        const itemDisabled = enumDisabled && enumDisabled.indexOf(option.value) !== -1;
        const checked = option.value === value;

        return (
          <label key={i} className='flex items-center gap-3 cursor-pointer'>
            <input
              type='radio'
              name={id}
              value={option.value}
              checked={checked}
              required={required}
              disabled={disabled || itemDisabled || readonly}
              onChange={() => onChange(option.value)}
              className='radio radio-primary'
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
