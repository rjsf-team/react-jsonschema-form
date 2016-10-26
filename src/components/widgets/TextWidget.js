import React, {PropTypes} from "react";

import BaseInput from "./BaseInput";


function TextWidget(props) {
  return <BaseInput {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  TextWidget.propTypes = {
    value: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
  };
}

export default TextWidget;
