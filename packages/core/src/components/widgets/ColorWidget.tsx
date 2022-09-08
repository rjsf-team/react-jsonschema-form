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
  const styles = {
    root: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    input: {
      order: 1,
    },
    picker: {
      order: 2,
      width: 60,
      padding: 0,
      border: "none",
      background: "none",
    },
  };
  return (
    <div style={styles.root}>
      <BaseInputTemplate
        type="text"
        style={styles.input}
        {...props}
        disabled={disabled || readonly}
      />
      <BaseInputTemplate
        type="color"
        style={styles.picker}
        {...props}
        autofocus={false}
        disabled={disabled || readonly}
      />
    </div>
  );
}
