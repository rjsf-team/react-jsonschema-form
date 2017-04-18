import React from "react";
import Proptypes from "prop-types";

import { rangeSpec } from "../../utils";
import BaseInput from "./BaseInput";

function UpDownWidget(props) {
  return <BaseInput type="number" {...props} {...rangeSpec(props.schema)} />;
}

if (process.env.NODE_ENV !== "production") {
  UpDownWidget.propTypes = {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };
}

export default UpDownWidget;
