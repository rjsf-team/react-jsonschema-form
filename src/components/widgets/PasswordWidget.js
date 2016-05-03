import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function PasswordWidget(props) {
  const {onChange} = props;
  return (
    <BaseInput
      type="password"
      {...props}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  PasswordWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default PasswordWidget;
