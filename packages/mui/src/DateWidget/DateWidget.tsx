import React from "react";
import { getTemplate, WidgetProps } from "@rjsf/utils";

const DateWidget = (props: WidgetProps) => {
  const { options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate">(
    "BaseInputTemplate",
    registry,
    options
  );
  return (
    <BaseInputTemplate
      type="date"
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
    />
  );
};

export default DateWidget;
