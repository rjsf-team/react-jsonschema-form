import React from "react";
import { FieldProps } from "@rjsf/core";

export interface DescriptionFieldProps extends Partial<FieldProps> {
  description?: string;
}

const DescriptionField = ({ description }: Partial<FieldProps>) => {
  if (description) {
    return <h2 className="mt-5">{description}</h2>;
  }

  return null;
};

export default DescriptionField;
