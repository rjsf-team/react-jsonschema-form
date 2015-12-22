import React, { PropTypes } from "react";

import Wrapper from "./../widgets/Wrapper";


/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue(type, value) {
  if (type === "boolean") {
    return value === "true";
  } else if (type === "number") {
    return value === Number(value);
  }
  return value;
}

function SelectWidget({
  type,
  options,
  label,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  return (
    <Wrapper label={label} required={required} type={type}>
      <select
        title={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange(processValue(type, event.target.value))}>{
        options.map((option, i) => {
          return <option key={i} value={option}>{String(option)}</option>;
        })
      }</select>
    </Wrapper>
  );
}

SelectWidget.propTypes = {
  type: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
  required: PropTypes.bool,
  onChange: PropTypes.func,
};

export default SelectWidget;
