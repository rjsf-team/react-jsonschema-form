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
  const options = {
    ...(AltDateWidget?.defaultProps?.options ?? {}),
    ...props.options,
  };

  return <AltDateWidget time={time} {...props} options={options} />;
}

export default AltDateTimeWidget;
