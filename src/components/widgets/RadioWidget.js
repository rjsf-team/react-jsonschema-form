import React from "react";
import PropTypes from "prop-types";
import Skeleton from 'react-loading-skeleton';

function RadioWidget(props) {
  const {
    options,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onBlur,
    onFocus,
    onChange,
    id,
  } = props;
  let isDataLoaded = true;
  if (props.isDataLoaded !== undefined) {
    isDataLoaded = props.isDataLoaded;
  }
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const { enumOptions, enumDisabled, inline } = options;
  // checked={checked} has been moved above name={name}, As mentioned in #349;
  // this is a temporary fix for radio button rendering bug in React, facebook/react#7630.
  return (
    <React.Fragment>
      {(value == null || value === "" || value === undefined) && !isDataLoaded && (
        <Skeleton/>
      )}
      {(value || isDataLoaded) && (
        <div className="field-radio-group" id={id}>
          {enumOptions.map((option, i) => {
            const checked = option.value === value;
            const itemDisabled =
              enumDisabled && enumDisabled.indexOf(option.value) != -1;
            const disabledCls =
              disabled || itemDisabled || readonly ? "disabled" : "";
            const radio = (
              <span>
                <input
                  type="radio"
                  checked={checked}
                  name={name}
                  id={`${id}_${i}`}
                  className="custom-control-input"
                  required={required}
                  value={option.value}
                  disabled={disabled || itemDisabled || readonly}
                  autoFocus={autofocus && i === 0}
                  onChange={_ => onChange(option.value)}
                  onBlur={onBlur && (event => onBlur(id, event.target.value))}
                  onFocus={onFocus && (event => onFocus(id, event.target.value))}
                />
                <label className="custom-control-label" htmlFor={`${id}_${i}`}>{option.label}</label>
              </span>
            );

            return inline ? (
              <div key={i} className={`custom-control custom-radio custom-control-inline ${disabledCls}`}>
                {radio}
              </div>
            ) : (
                <div key={i} className={`custom-control custom-radio ${disabledCls}`}>
                  {radio}
                </div>
              );
          })}
        </div>
      )}
    </React.Fragment>
  );
}

RadioWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
      inline: PropTypes.bool,
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}
export default RadioWidget;
