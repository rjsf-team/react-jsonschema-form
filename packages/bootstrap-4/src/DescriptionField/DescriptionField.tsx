import React from "react";
import { FieldProps } from "@rjsf/core";

const DescriptionField = ({ description }: FieldProps) => {
  if (description) {
    return <h2 className="mt-5">{description}</h2>;
  }

  return null;
};

export default DescriptionField;
