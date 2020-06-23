import React from "react";

import { WidgetProps, utils } from "@rjsf/core";

import TextWidget from "../TextWidget";

const URLWidget = (props: WidgetProps) => {
  const uiProps: any = props.options["props"] || {};
  let options = {
    ...props.options,
    props: {
      type: "url",
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

export default URLWidget;
