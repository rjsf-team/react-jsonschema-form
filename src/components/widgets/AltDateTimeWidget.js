import React from "react";
import PropTypes from "prop-types";
import AltDateWidget from "./AltDateWidget";

function AltDateTimeWidget(props) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget time {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  AltDateTimeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
    options: PropTypes.object,
  };
}

AltDateTimeWidget.defaultProps = {
  ...AltDateWidget.defaultProps,
  time: true,
};

export default AltDateTimeWidget;
