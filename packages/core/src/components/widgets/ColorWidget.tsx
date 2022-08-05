import React from "react";
import { WidgetProps } from "@rjsf/utils";

/** The `ColorWidget` component uses the `BaseInputTemplate` changing the type to `color` and disables it when it is
 * either disabled or readonly.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ColorWidget<T = any, F = any>(
  props: WidgetProps<T, F>
) {
  const {
    disabled,
    readonly,
    registry: {
      templates: { BaseInputTemplate },
    },
  } = props;
  return (
    <BaseInputTemplate
      type="color"
      {...props}
      disabled={disabled || readonly}
    />
  );
}
