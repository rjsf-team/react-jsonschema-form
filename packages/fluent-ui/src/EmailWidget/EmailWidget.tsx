import React from "react";

import { WidgetProps } from "@rjsf/core";

const EmailWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  const uiProps: any = props.options["props"] || {};
  let options = {
    ...props.options,
    props: {
      type: "email",
      ...uiProps,
    },
  };
  return (
    <TextWidget
      {...props}
      options={options}
      value={props.value}
      onChange={props.onChange}
      {...uiProps}
    />
  );
};

export default EmailWidget;
