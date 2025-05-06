import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
// Basic implementation using DateTimeWidget, real AltDateTime often uses selects
import DateTimeWidget from './DateTimeWidget';

// For now, just re-export DateTimeWidget. A full implementation would use selects.
export default function AltDateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  return <DateTimeWidget {...props} />;
}
