import React from "react";
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TitleFieldProps,
} from "@rjsf/utils";

export default function TitleField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ id, title, uiSchema }: TitleFieldProps<T, S, F>) {
  return (
    <>
      <div id={id} className="my-1">
        <h5>{(uiSchema && uiSchema["ui:title"]) || title}</h5>
        <hr className="border-0 bg-secondary" style={{ height: "1px" }} />
      </div>
    </>
  );
}
