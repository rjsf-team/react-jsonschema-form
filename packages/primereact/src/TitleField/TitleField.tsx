import React from "react";
import { FieldProps } from "@rjsf/core";

const TitleField = ({ title, uiSchema }: Pick<FieldProps, "title" | "uiSchema">) => (
  <div className="border-bottom-1 mb-2">
    <h5>{(uiSchema && uiSchema["ui:title"]) || title}</h5>
  </div>
);

export default TitleField;
