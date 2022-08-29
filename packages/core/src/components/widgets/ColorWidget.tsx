import React from "react";
import { getTemplate, WidgetProps } from "@rjsf/utils";

/** The `ColorWidget` component uses the `BaseInputTemplate` changing the type to `color` and disables it when it is
 * either disabled or readonly.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ColorWidget<T = any, F = any>(
  props: WidgetProps<T, F>
) {
  const { disabled, readonly, options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate", T, F>(
    "BaseInputTemplate",
    registry,
    options
  );
  return (
    <BaseInputTemplate
      type="color"
      {...props}
      disabled={disabled || readonly}
    />
  );
}
