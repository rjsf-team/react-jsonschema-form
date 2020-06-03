/* eslint-disable react/prop-types */
import React from "react";

function checkDescRender({ description, children }) {
  const { props } = children;
  // props.children[2] = description;
  console.info("description", description);
  console.info("children", children);
  console.info("query selector", props.children);
  // return dom update
  return children;
}

function DescriptionField({ className, description, children }) {
  if (children && description) {
    return checkDescRender({ description, children });
  }

  if (description) {
    return <p className={className || "sui-description"}>{description}</p>;
  }

  return children || null;
}

export default DescriptionField;
