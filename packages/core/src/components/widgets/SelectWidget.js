import React from "react";
import PropTypes from "prop-types";
// import _isEqual from "lodash/isEqual";
import _findIndex from "lodash/findIndex";

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
  const emptyValue = multiple ? [] : "";
  const selectedIndices =
    typeof value === "undefined"
      ? emptyValue
      : multiple
      ? value.map(value => _findIndex(enumOptions.map(el => el.value), value))
      : _findIndex(enumOptions.map(el => el.value), value);
  return (
    <select
      id={id}
      multiple={multiple}
      className="form-control"
      value={selectedIndices}
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
