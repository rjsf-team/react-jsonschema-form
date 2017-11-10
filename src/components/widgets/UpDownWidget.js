import React from "react";
import PropTypes from "prop-types";

import { rangeSpec } from "../../utils";

function UpDownWidget(props) {
  const { registry: { widgets: { BaseInput } } } = props;
  return <BaseInput type="number" {...props} {...rangeSpec(props.schema)} />;
}

if (process.env.NODE_ENV !== "production") {
  UpDownWidget.propTypes = {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };
}

export default UpDownWidget;
