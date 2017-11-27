import React from "react";
import PropTypes from "prop-types";

import { registryShape } from "../../types";

function PasswordWidget(props) {
  const { BaseInput } = props.registry.widgets;
  return <BaseInput type="password" {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  PasswordWidget.propTypes = {
    registry: registryShape.isRequired,
    value: PropTypes.string,
  };
}

export default PasswordWidget;
