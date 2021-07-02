import React from "react";
import { FieldProps } from "@rjsf/core";

export interface DescriptionFieldProps extends Partial<FieldProps> {
  description?: string;
}

const DescriptionField = ({ description }: Partial<FieldProps>) => {
  if (description) {
    return <div><div className="mb-3">{description}</div></div>;
  }

  return null;
};

export default DescriptionField;
