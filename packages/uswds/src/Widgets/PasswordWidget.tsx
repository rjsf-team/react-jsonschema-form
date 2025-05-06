import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import TextInputWidget from './TextInputWidget'; // Import the base text input

export default function PasswordWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  // Render the TextInputWidget with type="password"
  return <TextInputWidget {...props} type="password" />;
}
