import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import BooleanInput from '../BooleanInput.tsx';

/** The `CheckboxWidget` component renders a single checkbox input with DaisyUI styling.
 *
 * Features:
 * - Simple boolean input with DaisyUI checkbox styling
 * - Handles required, disabled, and readonly states
 * - Renders its own label after the input, and its own description
 * - Manages focus and blur events for accessibility
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  return <BooleanInput {...props} inputClassName='checkbox' labelClassName='label cursor-pointer justify-start' />;
}
