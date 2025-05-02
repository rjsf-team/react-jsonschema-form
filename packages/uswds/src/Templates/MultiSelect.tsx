import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Select } from '@trussworks/react-uswds';

export default function MultiSelect<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(props: any) {
  const { id, options, value, disabled, readonly, onChange } = props;
  return (
    <Select
      id={id}
      name={id}
      multiple
      value={value}
      disabled={disabled || readonly}
      onChange={onChange}
      options={options}
    />
  );
}
