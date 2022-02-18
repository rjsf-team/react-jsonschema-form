import React from "react";
import { FieldProps } from "@rjsf/core";

const DescriptionField = ({ description }: FieldProps) => {
  if (description) {
    return <div className="text-sm mt-1 mb-3">{description}</div>;
  }

  return null;
};

export default DescriptionField;
