import React from "react";
import { FieldProps } from "@rjsf/core";

export interface TitleFieldProps extends Partial<FieldProps> {
  title: string;
}

const TitleField = ({ title, uiSchema }: TitleFieldProps) => (
  <div className="my-1 border-bottom-1 border-500">
    <h5>{(uiSchema && uiSchema["ui:title"]) || title}</h5>
  </div>
);

export default TitleField;
