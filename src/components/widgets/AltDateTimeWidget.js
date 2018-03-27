/* This file has been modified from the original forked source code */
import PropTypes from "prop-types";
import React from "react";


function AltDateTimeWidget(props) {
  const {AltDateWidget} = props.registry.widgets;
  return <AltDateWidget time {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  AltDateTimeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default AltDateTimeWidget;
