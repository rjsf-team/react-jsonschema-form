import React from "react";
import { FieldProps } from "@rjsf/core";

export interface TitleFieldProps extends Partial<FieldProps> {
  title: string;
}

const TitleField = ({ title }: Partial<FieldProps>) => (
  <>
    <div className="my-1">
      <h5>{title}</h5>
      <hr className="border-0 bg-secondary" style={{ height: "1px" }} />
    </div>
  </>
);

export default TitleField;
