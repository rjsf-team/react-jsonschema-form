import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

/** The `AltDateTimeWidget` is an alternative widget for rendering datetime properties.
 * It uses the AltDateWidget for rendering, with the `time` prop set to true by default.
 */
function AltDateTimeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ time = true, ...props }: WidgetProps<T, S, F>) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget time={time} {...props} />;
}

export default AltDateTimeWidget;
