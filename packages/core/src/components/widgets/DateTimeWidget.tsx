import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getDateTimeLocalValue, getTemplate, localToUTC, padTimeSeconds, utcToLocal } from '@rjsf/utils';

/** The `DateTimeWidget` component uses the `BaseInputTemplate` changing the type to `datetime-local` and transforms
 * the value to/from utc using the appropriate utility functions. When `schema.format` is `iso-date-time`, a
 * timezone offset is not added on change, since that format's timezone is optional, but a stored value that
 * happens to carry one is still stripped for display, since a native `datetime-local` input can't render it.
 * Seconds are always padded on before returning a value, since `date-time` (naive local or not) requires them.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { onChange, value, options, registry, schema } = props;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>('BaseInputTemplate', registry, options);
  const { isIsoDateTime, localValue: isoLocalValue } = getDateTimeLocalValue(schema, value);
  const localValue = isIsoDateTime ? isoLocalValue : utcToLocal(value);
  const handleChange = (newValue: string) =>
    onChange(isIsoDateTime ? padTimeSeconds(newValue) || undefined : localToUTC(newValue));

  return <BaseInputTemplate type='datetime-local' {...props} value={localValue} onChange={handleChange} />;
}
