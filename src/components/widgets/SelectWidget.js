import React, { PropTypes } from "react";

import { asNumber } from "../../utils";


/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue(type, value) {
  if (type === "boolean") {
    return value === "true";
  } else if (type === "number") {
    return asNumber(value);
  }
  return value;
}

function SelectWidget({
  schema,
  options,
  label,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  return (
    <select
      title={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={(event) => {
        onChange(processValue(schema.type, event.target.value));
      }}>{
      options.map((option, i) => {
        return <option key={i} value={option}>{String(option)}</option>;
      })
    }</select>
  );
}

if (process.env.NODE_ENV !== "production") {
  SelectWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    options: PropTypes.array.isRequired,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    defaultValue: PropTypes.any,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default SelectWidget;
