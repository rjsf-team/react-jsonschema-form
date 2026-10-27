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
  const { valueFormat: optionValueFormat, displayFormat: optionDisplayFormat, ...otherOptions } = props.options;
  const valueFormat = typeof optionValueFormat === 'string' ? optionValueFormat : 'YYYY-MM-DD';
  const displayFormat =
    typeof optionDisplayFormat === 'string' && optionDisplayFormat ? optionDisplayFormat : valueFormat;

  return <DateTimeInput {...props} options={otherOptions} valueFormat={valueFormat} displayFormat={displayFormat} />;
}
