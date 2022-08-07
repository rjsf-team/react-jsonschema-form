import React from "react";
import { WidgetProps } from "@rjsf/utils";

function HiddenWidget<T = any, F = any>({ id, value }: WidgetProps<T, F>) {
  return (
    <input
      type="hidden"
      id={id}
      value={typeof value === "undefined" ? "" : value}
    />
  );
}

export default HiddenWidget;
