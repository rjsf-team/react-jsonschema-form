import React from "react";

interface DescriptionFieldI {
    description? : string
}

const DescriptionField = ({ description }: DescriptionFieldI) => {
  if (description) {
    return <h2 className="mt-5">{description}</h2>;
  }

  return null;
};

export default DescriptionField;
