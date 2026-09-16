import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import DateTimeInput from './DateTimeInput.tsx';

/** The `DateWidget` component uses the `DateTimeInput` changing the valueFormat to show `date`
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { valueFormat = 'YYYY-MM-DD', displayFormat, ...otherOptions } = props.options;

  return (
    <DateTimeInput
      {...props}
      options={otherOptions}
      valueFormat={valueFormat}
      displayFormat={displayFormat || valueFormat}
    />
  );
}
