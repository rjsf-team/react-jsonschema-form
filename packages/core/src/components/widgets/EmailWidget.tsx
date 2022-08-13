import React from "react";
import { getTemplate, WidgetProps } from "@rjsf/utils";

/** The `EmailWidget` component uses the `BaseInputTemplate` changing the type to `email`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function EmailWidget<T = any, F = any>(
  props: WidgetProps<T, F>
) {
  const { options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate", T, F>(
    "BaseInputTemplate",
    registry,
    options
  );
  return <BaseInputTemplate type="email" {...props} />;
}
