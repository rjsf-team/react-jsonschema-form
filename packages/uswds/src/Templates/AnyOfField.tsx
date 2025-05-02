import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Select } from '@trussworks/react-uswds';

interface Option {
  label: string;
  value: string;
}

interface AnyOfFieldProps<T = any, S = RJSFSchema, F = any> {
  options: Option[];
  id: string;
  value?: string;
  onChange: (value: string) => void;
}

export default function AnyOfField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: AnyOfFieldProps<T, S, F>
) {
  const { id, options = [], value, onChange } = props;

  return (
    <Select
      id={id}
      name={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}>
      {options.map((option: Option, index: number) => (
        <option key={index} value={option.value}>{option.label}</option>
      ))}
    </Select>
  );
}
