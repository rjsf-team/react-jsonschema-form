import React from "react";
import { getTemplate, WidgetProps } from "@rjsf/utils";

const TextareaWidget = (props: WidgetProps) => {
  const { options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate">(
    "BaseInputTemplate",
    registry,
    options
  );

  let rows: string | number = 5;
  if (typeof options.rows === "string" || typeof options.rows === "number") {
    rows = options.rows;
  }

  return <BaseInputTemplate {...props} multiline rows={rows} />;
};

export default TextareaWidget;
