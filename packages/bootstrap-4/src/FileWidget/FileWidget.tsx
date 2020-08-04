import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const FileWidget = (props: TextWidgetProps) => {
  return <TextWidget {...props} type="file"/>;
};

export default FileWidget;
