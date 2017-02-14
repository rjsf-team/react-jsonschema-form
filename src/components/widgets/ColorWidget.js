import React, {PropTypes} from "react";

import BaseInput from "./BaseInput";


function ColorWidget(props) {
  if (props.readonly) {
    let {...colorProps} = props;
    colorProps.disabled = true;
    return <BaseInput type="color" {...colorProps}/>;
  } else {
    return <BaseInput type="color" {...props}/>;
  }
  
}

if (process.env.NODE_ENV !== "production") {
  ColorWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default ColorWidget;
