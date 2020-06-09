import React from "react";

import { WidgetProps, utils } from "@rjsf/core";

import TextWidget from "../TextWidget";

const { localToUTC, utcToLocal } = utils;


const DateTimeWidget = (props: WidgetProps) => {
  const uiProps: any = props.options["props"] || {};

  const value = utcToLocal(props.value);
  const onChange = (value: any) => {
    props.onChange(localToUTC(value));
  };
  let options = {
    ...props.options,
    props: {
      type: "datetime-local",
      ...uiProps,
    },
  };
  // TODO: rows and columns.
  return <TextWidget {...props} options={options} value={value} onChange={onChange} />;
};

export default DateTimeWidget;
