import React, {PropTypes} from "react";

import {rangeSpec} from "../../utils";
import BaseInput from "./EPBCBaseInput";

function UpDownWidget(props) {
  return <BaseInput type="number" {...props} {...rangeSpec(props.schema)}/>;
}

if (process.env.NODE_ENV !== "production") {
  UpDownWidget.propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  };
}

export default UpDownWidget;
