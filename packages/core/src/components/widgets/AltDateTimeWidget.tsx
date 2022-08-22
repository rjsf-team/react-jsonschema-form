import { WidgetProps } from "@rjsf/utils";
import React from "react";

/** The `AltDateTimeWidget` is an alternative widget for rendering datetime properties.
 *  It uses the AltDateWidget for rendering, with the `time` prop set to true by default.
 *
 * @param props - The `WidgetProps` for this component
 */
function AltDateTimeWidget<T = any, F = any>({
  time = true,
  ...props
}: WidgetProps<T, F>) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget time={time} {...props} />;
}

export default AltDateTimeWidget;
