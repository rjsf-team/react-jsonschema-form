import React from "react";
import { FieldProps } from "@rjsf/core";

export interface DescriptionFieldProps extends Partial<FieldProps> {
  description?: string;
}

const DescriptionField = ({ description }: Partial<FieldProps>) => {
  if (description) {
    return <div><h6 className="mb-5">{description}</h6></div>;
  }

  return null;
};

export default DescriptionField;
