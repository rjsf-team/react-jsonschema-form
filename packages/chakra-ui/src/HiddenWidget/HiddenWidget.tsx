import React from "react";
import { WidgetProps } from "@rjsf/core";

const HiddenWidget = ({ id, value }: WidgetProps) => {
  return (
    <input
      id={id}
      name={id}
      value={typeof value === "undefined" ? "" : value}
      type="hidden"
    />
  );
};

export default HiddenWidget;
