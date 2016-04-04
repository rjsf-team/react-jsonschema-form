import React, { PropTypes } from "react";


function HiddenWidget({
  id,
  value,
  defaultValue
}) {
  return (
    <input type="hidden"
      id={id}
      value={value}
      defaultValue={defaultValue} />
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
    defaultValue: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.bool,
    ])
  };
}

export default HiddenWidget;
