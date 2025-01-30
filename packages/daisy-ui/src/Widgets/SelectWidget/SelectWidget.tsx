import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function SelectWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { options, value, required, disabled, readonly, onChange, id } = props;
  const { enumOptions, enumDisabled } = options;

  return (
    <select
      id={id}
      value={value}
      required={required}
      disabled={disabled || readonly}
      onChange={(event) => onChange(event.target.value)}
      className='select select-bordered w-full'
    >
      {!required && <option value=''>Select...</option>}
      {enumOptions?.map(({ value, label }, i) => {
        const disabled = enumDisabled && enumDisabled.indexOf(value) !== -1;
        return (
          <option key={i} value={value} disabled={disabled}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
