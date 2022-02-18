import React from "react";
import { FieldProps } from "@rjsf/core";

export interface DescriptionFieldProps extends Partial<FieldProps> {
  description?: string;
}

const DescriptionField = ({ description }: DescriptionFieldProps) => {
  if (description) {
    return <div className="mt-1 mb-3">{description}</div>;
  }

  return null;
};

export default DescriptionField;
