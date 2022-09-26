import React from "react";
import { DescriptionFieldProps } from "@rjsf/utils";

const DescriptionField = ({ description, id }: DescriptionFieldProps) => {
  if (!description) {
    return null;
  }
  return <span id={id}>{description}</span>;
};

export default DescriptionField;
