import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import TextInputWidget from './TextInputWidget'; // Use TextInputWidget

export default function UpDownWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  // Pass props to TextInputWidget, specifying type as number
  return <TextInputWidget {...props} type="number" />;
}
