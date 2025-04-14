import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import _AltDateWidget from './AltDateWidget';

/** The `AltDateTimeWidget` is an alternative widget for rendering datetime properties.
 *  It uses the AltDateWidget for rendering, with the `time` prop set to true by default.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function AltDateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget showTime {...props} />;
}

AltDateTimeWidget.defaultProps = {
  ..._AltDateWidget?.defaultProps,
  showTime: true,
};
