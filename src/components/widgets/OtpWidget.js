import React from "react";
import PropTypes from "prop-types";

function OtpWidget(props) {
  const { BaseInput } = props.registry.widgets;
  return <BaseInput type="tel" {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  OtpWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default OtpWidget;
