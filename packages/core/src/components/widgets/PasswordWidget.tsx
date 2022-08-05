import React from "react";
import { WidgetProps } from "@rjsf/utils";

/** The `PasswordWidget` component uses the `BaseInputTemplate` changing the type to `password`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<T = any, F = any>(
  props: WidgetProps<T, F>
) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate type="password" {...props} />;
}
