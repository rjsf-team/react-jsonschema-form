import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Radio } from '@trussworks/react-uswds';

export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(props: any) {
  const { id, options, value, disabled, readonly, onChange } = props;
  return (
    <Radio
      id={id}
      name={id}
      value={value}
      disabled={disabled || readonly}
      onChange={onChange}
      options={options}
    />
  );
}
