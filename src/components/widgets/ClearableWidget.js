import React, {PropTypes} from "react";


function ClearableWidget({onChange, value, children}) {
  const _onClear = (event) => {
    event.preventDefault();
    if (typeof value !== "undefined") {
      return onChange(undefined);
    }
  };
  const cleared = value === "" || value === undefined;
  const clearBtnCls = "glyphicon glyphicon-remove-sign clear-btn";
  const clearBtnStyles = {
    pointerEvents: "auto",
    textDecoration: "none",
    cursor: cleared ? "no-drop" : "pointer",
    color: cleared ? "#aaa" : "#888",
  };
  return (
    <div className="input-group">
      {children}
      <div className="input-group-addon">
        <a className={clearBtnCls} onClick={_onClear} style={clearBtnStyles}
          title="Reset field value"/>
      </div>
    </div>
  );
}

ClearableWidget.defaultProps = {
};

if (process.env.NODE_ENV !== "production") {
  ClearableWidget.propTypes = {
    onChange: PropTypes.func,
  };
}

export default ClearableWidget;
