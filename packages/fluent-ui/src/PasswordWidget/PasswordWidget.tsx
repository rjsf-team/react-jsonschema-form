import React from "react";

import { WidgetProps, utils } from "@rjsf/core";

import TextWidget from "../TextWidget";

const PasswordWidget = (props: WidgetProps) => {
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
