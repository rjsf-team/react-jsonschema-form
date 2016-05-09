import React, { PropTypes } from "react";


function HiddenWidget({id, value}) {
  return (
    <input type="hidden" id={id} value={value} />
  );
}

if (process.env.NODE_ENV !== "production") {
  HiddenWidget.propTypes = {
    id: PropTypes.string,
    value: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.bool,
    ]),
  };
}

export default HiddenWidget;
