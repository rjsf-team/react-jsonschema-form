import React from "react";
import { getTemplate, WidgetProps } from "@rjsf/utils";

const RangeWidget = (props: WidgetProps) => {
  const { value, label, options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate">(
    "BaseInputTemplate",
    registry,
    options
  );
  return (
    <BaseInputTemplate {...props} extraProps={label}>
      <span className="range-view">{value}</span>
    </BaseInputTemplate>
  );
};

export default RangeWidget;
