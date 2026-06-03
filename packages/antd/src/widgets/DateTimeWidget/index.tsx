import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import DateWidget from '../DateWidget';

/** The `DateTimeWidget` component uses the `DateWidget` with `showTime` enabled, transforming
 * the value to/from ISO string format.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  return <DateWidget showTime {...props} />;
}
