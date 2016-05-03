import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function ColorWidget(props) {
  const {onChange} = props;
  return (
    <BaseInput
      type="color"
      {...props}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  ColorWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default ColorWidget;
