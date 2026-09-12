import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTemplate, useTimeWidgetProps } from '@rjsf/utils';

/** The `TimeWidget` component uses the `BaseInputTemplate` changing the type to `time` and transforms
 * the value to undefined when it is falsy during the `onChange` handling. On change, the local UTC offset is
 * appended to the value so the stored `time` is compliant with the JSON Schema `time` format (RFC 3339
 * `full-time`), which requires a timezone; the offset is always stripped back off for display, since a
 * native time input doesn't understand it. When `schema.format` is `iso-time`, the offset is not added on
 * change, since that format's timezone is optional, but a stored value that happens to carry one is still
 * stripped for display.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TimeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { onChange, options, registry, schema } = props;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>('BaseInputTemplate', registry, options);
  const { localValue, computeTimeValue } = useTimeWidgetProps(props);
  const hasSecondPrecision =
    typeof schema.multipleOf === 'number' && Number.isFinite(schema.multipleOf) && schema.multipleOf < 60;
  const handleChange = useCallback(
    (newValue: any) => {
      if (!newValue) {
        onChange(undefined);
      } else {
        onChange(computeTimeValue(newValue));
      }
    },
    [computeTimeValue, onChange],
  );
  const displayValue =
    typeof localValue === 'string' && !hasSecondPrecision && /^\d{2}:\d{2}:00$/.test(localValue)
      ? localValue.slice(0, -3)
      : localValue;

  return <BaseInputTemplate type='time' {...props} value={displayValue} onChange={handleChange} />;
}
