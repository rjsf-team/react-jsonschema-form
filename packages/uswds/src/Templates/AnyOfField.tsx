import { FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { Select } from '@trussworks/react-uswds';

export default function AnyOfField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(props: any) {
  const { options, registry } = props;
  const { translateString } = registry;
  return (
    <Select
      id={props.id}
      onChange={(e) => props.onChange(e.target.value)}
      value={props.value}
    >
      <option value="">{translateString(TranslatableString.SelectLabel)}</option>
      {options.map((opt: any, i: number) => (
        <option key={i} value={i}>{opt.title || `Option ${i + 1}`}</option>
      ))}
    </Select>
  );
}
