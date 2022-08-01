import React from "react";
import { DescriptionFieldProps } from "@rjsf/utils";

const DescriptionField = ({ description }: DescriptionFieldProps) => {
  if (description) {
    return (
      <div>
        <div className="mb-3">{description}</div>
      </div>
    );
  }

  return null;
};

export default DescriptionField;
