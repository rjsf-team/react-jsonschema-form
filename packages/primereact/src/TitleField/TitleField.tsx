import React from "react";
import { FieldProps } from "@rjsf/core";

const TitleField = ({ title, uiSchema }: FieldProps) => (
  <div className="border-bottom-1 border-500 mb-2">
    <h5>{(uiSchema && uiSchema["ui:title"]) || title}</h5>
  </div>
);

export default TitleField;
