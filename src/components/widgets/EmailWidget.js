import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function EmailWidget(props) {
  const {onChange} = props;
  return (
    <BaseInput
      type="email"
      {...props}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  EmailWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default EmailWidget;
