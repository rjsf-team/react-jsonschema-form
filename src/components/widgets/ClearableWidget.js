import React, {PropTypes} from "react";


function ClearableWidget({onChange, children}) {
  const _onClear = (event) => {
    event.preventDefault();
    return onChange(undefined);
  };
  return (
    <div className="input-group">
    {children}
      <a href="#" className="input-group-addon clear-btn" title="Clear field"
        onClick={_onClear}>
        <i className="glyphicon glyphicon-remove"/>
      </a>
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
