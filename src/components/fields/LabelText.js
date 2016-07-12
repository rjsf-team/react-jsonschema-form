import React, { PropTypes } from "react";


function LabelText({label, required}) {
  // Only denote optionality
  // see https://uxdesign.cc/design-better-forms-96fadca0f49c
  if (required) {
    return <span className="label-text">{label}</span>;
  }
  return (
    <span>
      <span className="label-text">{label}</span>
      <span className="field-optional text-muted"
        style={{marginLeft: ".5rem", fontWeight: "normal"}}>- Optional</span>
    </span>
  );
}

if (process.env.NODE_ENV !== "production") {
  LabelText.propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool.isRequired,
  };
}

export default LabelText;
