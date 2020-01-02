import React from "react";
import PropTypes from "prop-types";
import _isEqual from "lodash/isEqual";

function getValue(event, enumOptions, multiple) {
  if (event.target.value === "") {
    return undefined;
  }
  if (multiple) {
    return [].slice
      .call(event.target.options)
      .filter(o => o.selected)
      .map(o => enumOptions[o.value].value);
  } else {
    return enumOptions[event.target.value].value;
  }
}

function getOneSelected(value, enumOptions) {
  if (typeof value === "undefined") {
    return "";
  }

  for (const i in enumOptions) {
    if (_isEqual(enumOptions[i].value, value)) {
      return i;
    }
  }
  return "";
}

function getMultipleSelected(values, enumOptions) {
  if (!Array.isArray(values)) {
    return [];
  }
  let selected = [];
  for (const i in enumOptions) {
    for (const value of values) {
      if (_isEqual(enumOptions[i].value, value)) {
        selected.push(i);
      }
    }
  }
  return selected;
}

function SelectWidget(props) {
  const {
    schema,
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    multiple,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    placeholder,
  } = props;
  const { enumOptions, enumDisabled } = options;
  const selected = multiple
    ? getMultipleSelected(value, enumOptions)
    : getOneSelected(value, enumOptions);
  return (
    <select
      id={id}
      multiple={multiple}
      className="form-control"
      value={selected}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={
        onBlur &&
        (event => {
          onBlur(id, getValue(event, enumOptions, multiple));
        })
      }
      onFocus={
        onFocus &&
        (event => {
          onFocus(id, getValue(event, enumOptions, multiple));
        })
      }
      onChange={event => {
        onChange(getValue(event, enumOptions, multiple));
      }}>
      {!multiple && schema.default === undefined && (
        <option value="">{placeholder}</option>
      )}
      {enumOptions.map(({ value, label }, i) => {
        const disabled = enumDisabled && enumDisabled.indexOf(value) != -1;
        return (
          <option key={i} value={i} disabled={disabled}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

SelectWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  SelectWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    multiple: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
  };
}

export default SelectWidget;
