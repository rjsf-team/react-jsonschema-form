import React from "react";
import PropTypes from "prop-types";

import BaseInput from "./BaseInput";

function ColorWidget(props) {
  const { disabled, readonly } = props;
  return <BaseInput type="color" {...props} disabled={disabled || readonly} />;
}

if (process.env.NODE_ENV !== "production") {
  ColorWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default ColorWidget;
