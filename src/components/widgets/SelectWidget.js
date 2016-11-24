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
  onChange
}) {
  var {enumOptions} = options;
  var { enumLabel,enumValue } = schema;
  if (multiple && schema.items) {
    if (schema.items.enumLabel) {
      enumLabel = schema.items.enumLabel;
    }
    if (schema.items.enumValue) {
      enumValue = schema.items.enumValue;
    }
  }
  if (!enumValue) {
    enumValue = "value";
  }
  if (!enumLabel) {
    enumLabel = "label";
  }  
  if (!enumOptions) {
    enumOptions = [];
  }
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
      onChange={(event) => {
        let newValue;
        if (multiple) {
          newValue = [].filter.call(
            event.target.options, o => o.selected).map(o => o.value);
        } else {
          newValue = event.target.value;
        }
        onChange(processValue(schema, newValue));
      }}>{
      enumOptions.map((option, i) => {
        return <option key={i} value={option[enumValue]}>{option[enumLabel]}</option>;
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
  };
}

export default SelectWidget;
