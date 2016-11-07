import React, {PropTypes} from "react";

import BaseInput from "./EPBCBaseInput";


function PasswordWidget(props) {
  return <BaseInput type="password" {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  PasswordWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default PasswordWidget;
