import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTemplate } from '@rjsf/utils';

/** The `TimeWidget` component uses the `BaseInputTemplate` changing the type to `time` and transforms
 * the value to undefined when it is falsy during the `onChange` handling.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TimeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { onChange, options, registry, schema, value } = props;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>('BaseInputTemplate', registry, options);
  const hasSecondPrecision =
    typeof schema.multipleOf === 'number' && Number.isFinite(schema.multipleOf) && schema.multipleOf < 60;
  const handleChange = useCallback(
    (newValue: any) => {
      if (!newValue) {
        onChange(undefined);
      } else if (hasSecondPrecision) {
        onChange(newValue);
      } else {
        onChange(`${newValue}:00`);
      }
    },
    [hasSecondPrecision, onChange],
  );
  const displayValue =
    typeof value === 'string' && !hasSecondPrecision && /^\d{2}:\d{2}:00$/.test(value) ? value.slice(0, -3) : value;

  return <BaseInputTemplate type='time' {...props} value={displayValue} onChange={handleChange} />;
}
