import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import useControlState from '../../controlState.ts';

/** The `HiddenWidget` renders a hidden input, disabled by the same control state as every other antd widget, so it
 * posts nothing under `readonlyAsDisabled` or a `<ConfigProvider componentDisabled>`, as a disabled native control
 * posts nothing
 *
 * @param props - The `WidgetProps` for this component
 */
export default function HiddenWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, value, htmlName, disabled, readonly, registry }: WidgetProps<T, S, F>) {
  const control = useControlState<T, S, F>({ disabled, readonly, registry });
  return (
    <input
      type='hidden'
      id={id}
      name={htmlName || id}
      value={typeof value === 'undefined' ? '' : value}
      disabled={control.disabled}
    />
  );
}
