import React from "react";

import { WidgetProps } from "@rjsf/core";

const TextareaWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  const uiProps: any = props.options["props"] || {};
  let options = {
    ...props.options,
    "props": {
      multiline: true,
      ...uiProps
    }
  };
  // TODO: rows and columns.
  return (
    <TextWidget {...props} options={options} />
  );
}

export default TextareaWidget;
