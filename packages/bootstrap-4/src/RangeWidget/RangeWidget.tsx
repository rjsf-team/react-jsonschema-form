import React from "react";
import { WidgetProps } from "@rjsf/utils";

const RangeWidget = (props: WidgetProps) => {
  const {
    value,
    label,
    registry: {
      templates: { BaseInputTemplate },
    },
  } = props;
  return (
    <BaseInputTemplate {...props} extraProps={label}>
      <span className="range-view">{value}</span>
    </BaseInputTemplate>
  );
};

export default RangeWidget;
