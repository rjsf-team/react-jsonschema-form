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
  placeholder,
  value,
  defaultValue,
  required,
  multiple,
  onChange
}) {
  return (
    <select
      multiple={multiple}
      title={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={(event) => {
        let newValue;
        if (multiple) {
          newValue = [].filter.call(
            event.target.options, o => o.selected).map(o => o.value);
        } else {
          newValue = event.target.value;
        }

        onChange(processValue(schema.type, newValue));
      }}>{
      options.map(({value, label}, i) => {
        return <option key={i} value={value}>{label}</option>;
      })
    }</select>
  );
}

if (process.env.NODE_ENV !== "production") {
  SelectWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    options: PropTypes.array.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    defaultValue: PropTypes.any,
    required: PropTypes.bool,
    multiple: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default SelectWidget;
