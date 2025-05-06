import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Select } from '@trussworks/react-uswds';

interface Option {
  label: string;
  value: string;
}

interface AnyOfFieldProps<
  T extends string | number | readonly string[] = string,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> {
  options: Option[];
  id: string;
  value?: T;
  onChange: (value: T) => void;
  schema: S;
  uiSchema: F;
}

export default function AnyOfField<
  T extends string | number | readonly string[] = string,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: AnyOfFieldProps<T, S, F>) {
  const { id, options = [], value, onChange } = props;

  return (
    <Select
      id={id}
      name={id}
      value={value as string}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((option: Option, index: number) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
