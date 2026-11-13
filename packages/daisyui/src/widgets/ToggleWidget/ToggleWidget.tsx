import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { joinClassNames } from '@rjsf/utils';

import { classNameOption } from '../../utils.ts';
import BooleanInput from '../BooleanInput.tsx';

/** The `ToggleWidget` component renders a toggle switch input with DaisyUI styling
 *
 * Features:
 * - Provides a visual toggle switch rather than a standard checkbox
 * - Supports different sizes through options (sm, md, lg)
 * - Handles required, disabled, and readonly states
 * - Manages focus and blur events for accessibility
 * - Renders its own label after the switch, and its own description, as `CheckboxWidget` does
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ToggleWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const size = classNameOption(props.options.size);
  const sizeClass = size === undefined || size === 'md' ? '' : `toggle-${size}`;

  return (
    <BooleanInput
      {...props}
      inputClassName={joinClassNames('toggle', sizeClass, 'mr-2')}
      labelClassName='cursor-pointer label my-auto justify-start'
    />
  );
}
