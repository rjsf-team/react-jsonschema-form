import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import DateTimeInput from './DateTimeInput.tsx';

/** The `DateTimeWidget` component uses the `DateTimeInput` with `withTime`, rendering Mantine's `DateTimePicker`,
 * and changing the valueFormat to show `datetime`. The seconds segment shows when `valueFormat` has seconds. For
 * `format: "iso-date-time"`, the default `valueFormat` uses a `T` separator to match the naive local string
 * produced by the `iso-date-time` `DateTimeWidget`s in `@rjsf/core`, `@rjsf/antd`, and `@rjsf/daisyui`, so the
 * same schema behaves consistently across themes. `format: "date-time"`/`"datetime"` bypass `valueFormat` for
 * the committed value (there it only sets the shown format and the seconds segment), so its default keeps the
 * original, more human-readable separator.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const defaultValueFormat = props.schema.format === 'iso-date-time' ? 'YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DD HH:mm:ss';

  return <DateTimeInput {...props} defaultValueFormat={defaultValueFormat} withTime />;
}
