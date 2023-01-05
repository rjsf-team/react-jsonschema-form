import React from "react";
import {
  FormContextType,
  getTemplate,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";

export default function FileWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { options, registry } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate", T, S, F>(
    "BaseInputTemplate",
    registry,
    options
  );
  return <BaseInputTemplate {...props} type="file" />;
}
