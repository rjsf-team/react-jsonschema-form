import React from "react";
import { TitleFieldProps } from "@rjsf/utils";

const TitleField = ({ id, title, uiSchema }: TitleFieldProps) => (
  <>
    <div id={id} className="my-1">
      <h5>{(uiSchema && uiSchema["ui:title"]) || title}</h5>
      <hr className="border-0 bg-secondary" style={{ height: "1px" }} />
    </div>
  </>
);

export default TitleField;
