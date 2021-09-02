import React from "react";
import PropTypes from "prop-types";
import Skeleton from 'react-loading-skeleton';

function TextareaWidget(props) {
  const {
    id,
    options,
    placeholder,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus,
  } = props;

  let isDataLoaded = true;
  if (props.isDataLoaded !== undefined) {
    isDataLoaded = props.isDataLoaded;
  }
  const _onChange = ({ target: { value } }) => {
    return onChange(value === "" ? options.emptyValue : value);
  };
  return (
    <React.Fragment>
      {(value == null || value === "" || value === undefined) && !isDataLoaded && (
        <Skeleton/>
      )}
      {(value || isDataLoaded) && (
        <textarea
          id={id}
          className="form-control"
          value={typeof value === "undefined" ? "" : value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          data-cy={props["data-cy"]}
          readOnly={readonly}
          autoFocus={autofocus}
          rows={options.rows}
          onBlur={onBlur && (event => onBlur(id, event.target.value))}
          onFocus={onFocus && (event => onFocus(id, event.target.value))}
          onChange={_onChange}
        />
      )}
    </React.Fragment>
  );
}

TextareaWidget.defaultProps = {
  autofocus: false,
  options: {},
};

if (process.env.NODE_ENV !== "production") {
  TextareaWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    options: PropTypes.shape({
      rows: PropTypes.number,
    }),
    value: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
  };
}

export default TextareaWidget;
