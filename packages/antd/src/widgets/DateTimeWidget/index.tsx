import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import DateWidget from '../DateWidget/index.tsx';

/** The `DateTimeWidget` component uses the `DateWidget` with `showTime` enabled, transforming
 * the value to/from ISO string format.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  return <DateWidget showTime {...props} />;
}
