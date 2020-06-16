import React from "react";

interface DescriptionFieldI  {
    description? : string
}

const DescriptionField = ({ description }: DescriptionFieldI) => {
  if (description) {
    return (
      <>
        <style type="text/css">
          {`
    .h2 {
        margin-top: 5px
    }
    `}
        </style>
        <h2>{description}</h2>
      </>
    );
  }

  return null;
};

export default DescriptionField;
