import React, {PropTypes} from "react";

import BaseInput from "./BaseInput";


function URLWidget(props) {
  return <BaseInput type="url" {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  URLWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default URLWidget;
