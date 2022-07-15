import React from "react";

import { WidgetProps } from "@rjsf/utils";

const TextareaWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  const uiProps: any = props.options["props"] || {};
  const options = {
    ...props.options,
    props: {
      multiline: true,
      ...uiProps,
    },
  };
  // TODO: rows and columns.
  return <TextWidget {...props} options={options} />;
};

export default TextareaWidget;
