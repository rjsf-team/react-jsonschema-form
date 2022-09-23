import React from "react";

import { WidgetProps, getTemplate, localToUTC, utcToLocal } from "@rjsf/utils";

const DateTimeWidget = (props: WidgetProps) => {
  const { registry } = props;
  const uiProps: any = props.options["props"] || {};
  const options = {
    ...props.options,
    props: {
      type: "datetime-local",
      ...uiProps,
    },
  };
  const BaseInputTemplate = getTemplate<"BaseInputTemplate">(
    "BaseInputTemplate",
    registry,
    options
  );

  const value = utcToLocal(props.value);
  const onChange = (value: any) => {
    props.onChange(localToUTC(value));
  };
  // TODO: rows and columns.
  return (
    <BaseInputTemplate
      {...props}
      options={options}
      value={value}
      onChange={onChange}
    />
  );
};

export default DateTimeWidget;
