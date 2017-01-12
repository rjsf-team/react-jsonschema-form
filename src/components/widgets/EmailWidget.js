import React, {PropTypes} from "react";

import BaseInput from "./BaseInput";


function EmailWidget(props) {
  return <BaseInput type="email" {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  EmailWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default EmailWidget;
