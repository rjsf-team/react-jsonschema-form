import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function TextWidget(props) {
  const {onChange} = props;
  return (
    <BaseInput
      {...props}
      onChange={(event) => onChange(event.target.value)} />
  );
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
