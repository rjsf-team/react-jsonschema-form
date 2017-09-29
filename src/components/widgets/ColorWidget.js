import React from "react";
import PropTypes from "prop-types";

function ColorWidget(props) {
  const { disabled, readonly, registry: { widgets: { BaseInput } } } = props;
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
