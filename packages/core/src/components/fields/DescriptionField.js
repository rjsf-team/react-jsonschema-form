import React from "react";
import PropTypes from "prop-types";

function DescriptionField(props) {
  const { id, description } = props;
  if (!description) {
    return null;
  }
  if (typeof description === "string") {
    return (
      <p id={id} className="field-description">
        {description}
      </p>
    );
  } else {
    return (
      <div id={id} className="field-description">
        {description}
      </div>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  DescriptionField.propTypes = {
    id: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
  };
}

export default DescriptionField;
