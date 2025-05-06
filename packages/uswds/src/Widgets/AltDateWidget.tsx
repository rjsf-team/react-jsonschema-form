import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
// Basic implementation using DateWidget, real AltDate often uses selects
import DateWidget from './DateWidget';

// For now, just re-export DateWidget. A full implementation would use selects.
export default function AltDateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  return <DateWidget {...props} />;
}
