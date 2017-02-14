import React, {PropTypes} from "react";


function ClearableWidget({onChange, disabled, readonly, value, children}) {
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
  return disabled || readonly ? children : (
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
  disabled: false,
  readonly: false,
};

if (process.env.NODE_ENV !== "production") {
  ClearableWidget.propTypes = {
    children: React.PropTypes.element.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.any,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
  };
}

export default ClearableWidget;
