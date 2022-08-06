import React from "react";
import { DescriptionFieldProps } from "@rjsf/utils";

const DescriptionField = ({ id, description }: DescriptionFieldProps) => {
  if (description) {
    return (
      <div>
        <div id={id} className="mb-3">
          {description}
        </div>
      </div>
    );
  }

  return null;
};

export default DescriptionField;
