import React from "react";
import { getTemplate, localToUTC, utcToLocal, WidgetProps } from "@rjsf/utils";

const DateTimeWidget = (props: WidgetProps) => {
  const { options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate">(
    "BaseInputTemplate",
    registry,
    options
  );
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
