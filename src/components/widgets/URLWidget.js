import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function URLWidget(props) {
  const {onChange} = props;
  return (
    <BaseInput
      type="url"
      {...props}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  URLWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default URLWidget;
