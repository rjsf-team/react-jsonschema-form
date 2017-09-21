import React, { PropTypes } from "react";

import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

import { asNumber } from "../../utils";

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue({ type, items }, value) {
  if (type === "array" && items && ["number", "integer"].includes(items.type)) {
    return value.map(asNumber);
  } else if (type === "boolean") {
    return value === true;
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
  label,
  required,
  disabled,
  readonly,
  multiple,
  autofocus,
  onChange,
}) {
  const { enumOptions } = options;

  return (
    <SelectField
      id={id}
      multiple={multiple}
      floatingLabelText={label}
      value={value}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      onChange={(event, key, value) => {
        onChange(processValue(schema, value));
      }}>
      {enumOptions.map(({ value, label }, i) => {
        return <MenuItem key={i} value={value} primaryText={label} />;
      })}
    </SelectField>
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
