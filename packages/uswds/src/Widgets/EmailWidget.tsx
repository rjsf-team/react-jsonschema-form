import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import TextInputWidget from './TextInputWidget'; // Corrected import

export default function EmailWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  return <TextInputWidget {...props} type="email" />;
}
