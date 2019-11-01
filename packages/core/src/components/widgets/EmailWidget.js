import React from "react";
import PropTypes from "prop-types";

function EmailWidget(props) {
  const { BaseInput } = props.registry.widgets;
  return <BaseInput type="email" {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  EmailWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default EmailWidget;
