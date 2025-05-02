import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { Select as UswdsSelect } from '@trussworks/react-uswds';

export default function Select<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { id, value, disabled, onChange } = props;
  const enumOptions = props.options?.enumOptions || [];

  return (
    <UswdsSelect
      id={id}
      name={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}>
      {enumOptions.map(({ value, label }, i) => (
        <option key={i} value={value}>{label}</option>
      ))}
    </UswdsSelect>
  );
}
