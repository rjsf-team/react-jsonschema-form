import React from "react";

import { WidgetProps } from "@rjsf/core";

import TextWidget from "../TextWidget";

const DateTimeWidget = (props: WidgetProps) => {
  const uiProps: any = props.options["props"] || {};
  let options = {
    ...props.options,
    props: {
      type: "datetime-local",
      ...uiProps,
    },
  };
  // TODO: rows and columns.
  return <TextWidget {...props} options={options} />;
};

export default DateTimeWidget;
