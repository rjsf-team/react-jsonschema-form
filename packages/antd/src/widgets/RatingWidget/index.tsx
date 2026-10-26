import { RatingWidget as CoreRatingWidget } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import useControlState from '../../controlState.ts';

/** The `RatingWidget` renders `@rjsf/core`'s rating, which antd has no control of its own for, disabled by the same
 * control state as every other antd widget, so it follows `readonlyAsDisabled` and a `<ConfigProvider
 * componentDisabled>` with them
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RatingWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { disabled, readonly, registry } = props;
  const control = useControlState<T, S, F>({ disabled, readonly, registry });
  return <CoreRatingWidget<T, S, F> {...props} disabled={control.disabled} />;
}
