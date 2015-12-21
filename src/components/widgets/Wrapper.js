import React from "react";

const REQUIRED_FIELD_SYMBOL = "*";

function getLabel(label, required) {
  if (!label) {
    return null;
  }
  if (required) {
    return label + REQUIRED_FIELD_SYMBOL;
  }
  return label;
}

export default function Wrapper({type, children, label, required}) {
  return (
    <div className={`field field-${type}`}>
      <label>
        {getLabel(label, required)}
        {children}
      </label>
    </div>
  );
}
