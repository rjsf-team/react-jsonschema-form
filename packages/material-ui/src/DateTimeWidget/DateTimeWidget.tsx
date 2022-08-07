import React from "react";
import { localToUTC, utcToLocal, WidgetProps } from "@rjsf/utils";

const DateTimeWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { BaseInputTemplate } = registry.templates;
  const value = utcToLocal(props.value);
  const onChange = (value: any) => {
    props.onChange(localToUTC(value));
  };

  return (
    <BaseInputTemplate
      type="datetime-local"
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
      value={value}
      onChange={onChange}
    />
  );
};

export default DateTimeWidget;
