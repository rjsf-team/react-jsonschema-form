import React from "react";
import PropTypes from "prop-types";

function HiddenWidget({ id, value, path, name }) {
  return (
    <input
      type="hidden"
      id={id}
      name={name}
      value={typeof value === "undefined" ? "" : value}
    />
  );
}

if (process.env.NODE_ENV !== "production") {
  HiddenWidget.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
    ]),
  };
}

export default HiddenWidget;
