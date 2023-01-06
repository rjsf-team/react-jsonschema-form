import React from "react";
import {
  FormContextType,
  getTemplate,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";

export default function RangeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { value, label, options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate", T, S, F>(
    "BaseInputTemplate",
    registry,
    options
  );
  return (
    <BaseInputTemplate {...props} extraProps={label}>
      <span className="range-view">{value}</span>
    </BaseInputTemplate>
  );
}
