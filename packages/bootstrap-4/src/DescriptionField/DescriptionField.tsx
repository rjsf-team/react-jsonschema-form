import React from "react";
import { FieldProps } from "@rjsf/core";

export interface DescriptionFieldProps extends FieldProps {
    description?: string
}

const DescriptionField = ({ description }: DescriptionFieldProps) => {
  if (description) {
    return <h2 className="mt-5">{description}</h2>;
  }

  return null;
};

export default DescriptionField;
