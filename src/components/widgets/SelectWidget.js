import React, {PropTypes} from "react";

import {asNumber} from "../../utils";

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue({type, items}, value) {
  if (type === "array" && items && ["number", "integer"].includes(items.type)) {
    return value.map(asNumber);
  } else if (type === "boolean") {
    return value === "true";
  } else if (type === "number") {
    return asNumber(value);
  }
  return value;
}

function getValue(event, multiple) {
  let newValue;
  if (multiple) {
    newValue = [].filter.call(
      event.target.options, o => o.selected).map(o => o.value);
  } else {
    newValue = event.target.value;
  }

  return newValue;
}

function SelectWidget({
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
  onBlur
}) {
  const {enumOptions} = options;
  return (
    <select
      id={id}
      multiple={multiple}
      className="form-control"
      value={value}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      onBlur={(event) => {
        const newValue = getValue(event, multiple);
        onBlur(id, processValue(schema, newValue));
      }}
      onChange={(event) => {
        const newValue = getValue(event, multiple);
        onChange(processValue(schema, newValue));
      }}>{
      enumOptions.map(({value, label}, i) => {
        return <option key={i} value={value}>{label}</option>;
      })
    }</select>
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
    multiple: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
  };
}

export default SelectWidget;
