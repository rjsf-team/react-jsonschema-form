import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import DateTimeInput from './DateTimeInput.tsx';

/** The `DateWidget` component uses the `DateTimeInput` changing the valueFormat to show `datetime`. For
 * `format: "iso-date-time"`, the default `valueFormat` uses a `T` separator to match the naive local string
 * produced by the `iso-date-time` `DateTimeWidget`s in `@rjsf/core`, `@rjsf/antd`, and `@rjsf/daisyui`, so the
 * same schema behaves consistently across themes. `format: "date-time"`/`"datetime"` bypass `valueFormat` for
 * the committed value (it's only used as the calendar's typing format), so its default keeps the original,
 * more human-readable separator.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { schema } = props;
  const defaultValueFormat = schema.format === 'iso-date-time' ? 'YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DD HH:mm:ss';
  const { valueFormat = defaultValueFormat, displayFormat, ...otherOptions } = props.options;

  return (
    <DateTimeInput
      {...props}
      options={otherOptions}
      valueFormat={valueFormat}
      displayFormat={displayFormat || valueFormat}
    />
  );
}
