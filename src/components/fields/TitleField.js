import React from "react";
import PropTypes from "prop-types";

const REQUIRED_FIELD_SYMBOL = "*";

function TitleField(props) {
  const { id, title, required } = props;
  return (
    <h5 id={id} className="control-label">
      {title}
      {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
    </h5>
  );
}

if (process.env.NODE_ENV !== "production") {
  TitleField.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    required: PropTypes.bool,
  };
}

export default TitleField;
