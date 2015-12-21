import React, { PropTypes } from "react";

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

function Wrapper({type, children, label, required}) {
  return (
    <div className={`field field-${type}`}>
      <label>
        {getLabel(label, required)}
        {children}
      </label>
    </div>
  );
}

Wrapper.propTypes = {
  type: PropTypes.string.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  children: React.PropTypes.node.isRequired,
};

export default Wrapper;
