import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import DateTimeInput from './DateTimeInput';

/** The `DateWidget` component uses the `DateTimeInput` changing the valueFormat to show `datetime`
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { valueFormat = 'YYYY-MM-DD HH:mm:ss', displayFormat, ...otherOptions } = props.options;

  return (
    <DateTimeInput
      {...props}
      options={otherOptions}
      valueFormat={valueFormat}
      displayFormat={displayFormat || valueFormat}
    />
  );
}
