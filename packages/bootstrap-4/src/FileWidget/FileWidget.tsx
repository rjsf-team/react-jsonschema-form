import React from "react";
import { getTemplate, WidgetProps } from "@rjsf/utils";

const FileWidget = (props: WidgetProps) => {
  const { options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate">(
    "BaseInputTemplate",
    registry,
    options
  );
  return <BaseInputTemplate {...props} type="file" />;
};

export default FileWidget;
