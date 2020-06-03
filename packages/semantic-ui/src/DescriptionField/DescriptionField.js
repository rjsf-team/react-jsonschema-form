/* eslint-disable react/prop-types */
import React from "react";

function DescriptionField({ className, description }) {
  if (description) {
    return <p className={className || "sui-description"}>{description}</p>;
  }
}

export default DescriptionField;
