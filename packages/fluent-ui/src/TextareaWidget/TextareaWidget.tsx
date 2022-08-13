import React from "react";
import { getTemplate, getUiOptions, WidgetProps } from "@rjsf/utils";

const TextareaWidget = (props: WidgetProps) => {
  const { uiSchema, registry } = props;
  const options = getUiOptions(uiSchema);
  const BaseInputTemplate = getTemplate<"BaseInputTemplate">(
    "BaseInputTemplate",
    registry,
    options
  );
  // TODO: rows and columns.
  return <BaseInputTemplate {...props} multiline />;
};

export default TextareaWidget;
