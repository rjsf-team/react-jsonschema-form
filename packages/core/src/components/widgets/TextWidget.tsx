import React from "react";
import { WidgetProps } from "@rjsf/utils";

/** The `TextWidget` component uses the `BaseInputTemplate`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextWidget<T = any, F = any>(props: WidgetProps<T, F>) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate {...props} />;
}
