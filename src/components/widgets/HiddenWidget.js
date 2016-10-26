import React, {PropTypes} from "react";


function HiddenWidget({id, value}) {
  return (
    <input type="hidden" id={id} value={typeof value === "undefined" ? "" : value}/>
  );
}

if (process.env.NODE_ENV !== "production") {
  HiddenWidget.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.bool,
    ]),
  };
}

export default HiddenWidget;
