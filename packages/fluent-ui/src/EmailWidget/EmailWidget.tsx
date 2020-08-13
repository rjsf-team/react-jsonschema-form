import React from "react";

import { WidgetProps } from "@rjsf/core";

import TextWidget from "../TextWidget";

const EmailWidget = (props: WidgetProps) => {
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
