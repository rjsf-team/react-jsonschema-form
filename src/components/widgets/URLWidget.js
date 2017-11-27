import React from "react";
import PropTypes from "prop-types";

import { registryShape } from "../../types";

function URLWidget(props) {
  const { BaseInput } = props.registry.widgets;
  return <BaseInput type="url" {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  URLWidget.propTypes = {
    registry: registryShape.isRequired,
    value: PropTypes.string,
  };
}

export default URLWidget;
