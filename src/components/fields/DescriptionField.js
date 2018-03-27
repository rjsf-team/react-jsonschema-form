/* This file has been modified from the original forked source code */
import PropTypes from "prop-types";
import React from "react";

function DescriptionField(props) {
  const {id, description} = props;
  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return <div/>;
  }
  if (typeof description === "string") {
    return <p id={id} className="field-description">{description}</p>;
  } else {
    return <div id={id} className="field-description">{description}</div>;
  }
}

if (process.env.NODE_ENV !== "production") {
  DescriptionField.propTypes = {
    id: PropTypes.string,
    description: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element,
    ])
  };
}

export default DescriptionField;
