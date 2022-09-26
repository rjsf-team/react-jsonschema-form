import React from "react";
import { DescriptionFieldProps } from "@rjsf/utils";

function DescriptionField({ description, id }: DescriptionFieldProps) {
  if (!description) {
    return null;
  }
  return (
    <p id={id} className="sui-description">
      {description}
    </p>
  );
}

export default DescriptionField;
