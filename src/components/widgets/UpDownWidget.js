import React, { PropTypes } from "react";


function rangeSpec(schema) {
  const spec = {};
  if (schema.multipleOf) {
    spec.step = schema.multipleOf;
  }
  if (schema.minimum) {
    spec.min = schema.minimum;
  }
  if (schema.maximum) {
    spec.max = schema.maximum;
  }
  return spec;
}

function UpDownWidget({
  schema,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  return (
    <input type="number"
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      {...rangeSpec(schema)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  UpDownWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    defaultValue: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default UpDownWidget;
