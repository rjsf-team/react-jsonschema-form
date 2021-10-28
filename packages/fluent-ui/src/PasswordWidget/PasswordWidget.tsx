import React from "react";

import { WidgetProps } from "@rjsf/core";

const PasswordWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  const uiProps: any = props.options["props"] || {};
  let options = {
    ...props.options,
    props: {
      type: "password",
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

export default PasswordWidget;
