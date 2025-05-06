import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { RangeInput as UswdsRange } from '@trussworks/react-uswds';

export default function RangeInput<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: any) {
  const { id, value, min, max, step, disabled, readonly, onChange } = props;
  return (
    <UswdsRange
      id={id}
      name={id}
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled || readonly}
      onChange={onChange}
    />
  );
}
