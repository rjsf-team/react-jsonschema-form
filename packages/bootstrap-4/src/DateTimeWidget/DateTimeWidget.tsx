import React from "react";
import { utils, WidgetProps } from "@rjsf/core";

const { localToUTC, utcToLocal } = utils;

const DateTimeWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  const value = utcToLocal(props.value);
  const onChange = (value: any) => {
    props.onChange(localToUTC(value));
  };

  return (
    <TextWidget
      {...props}
      type="datetime-local"
      value={value}
      onChange={onChange}
    />
  );
};

export default DateTimeWidget;
