import { utils, WidgetProps } from "@visma/rjsf-core";
import React from "react";

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
