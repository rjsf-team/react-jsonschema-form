import React from "react";
import PropTypes from "prop-types";

import { asNumber, guessType } from "../../utils";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";

const classes = PropTypes.object.isRequired;

const nums = new Set(["number", "integer"]);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue(schema, value) {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;
  if (value === "") {
    return undefined;
  } else if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  } else if (type === "boolean") {
    return value === "true";
  } else if (type === "number") {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every(x => guessType(x) === "number")) {
      return asNumber(value);
    } else if (schema.enum.every(x => guessType(x) === "boolean")) {
      return value === "true";
    }
  }

  return value;
}

function getValue(event, multiple) {
  if (multiple) {
    return [].slice
      .call(event.target.options)
      .filter(o => o.selected)
      .map(o => o.value);
  } else {
    return event.target.value;
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
  return (
    <FormControl>
      {(options.shortLabel || placeholder) && (
        <InputLabel htmlFor={id + "-select"}>
          {placeholder ? placeholder : options.shortLabel}
        </InputLabel>
      )}

      <Select
        id={id}
        multiple={typeof multiple === "undefined" ? false : multiple}
        className={classes.selectEmpty}
        // className="form-control"
        value={typeof value === "undefined" ? emptyValue : value}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        input={<Input id={id + "-select"} />}
        onBlur={
          onBlur &&
          (event => {
            const newValue = getValue(event, multiple);
            onBlur(id, processValue(schema, newValue));
          })
        }
        onFocus={
          onFocus &&
          (event => {
            const newValue = getValue(event, multiple);
            onFocus(id, processValue(schema, newValue));
          })
        }
        onChange={event => {
          const newValue = getValue(event, multiple);
          onChange(processValue(schema, newValue));
        }}>
        {!multiple && schema.default === undefined && (
          <MenuItem value="">{placeholder ? placeholder : "Select"}</MenuItem>
        )}
        {enumOptions.map(({ value, label }, i) => {
          const disabled = enumDisabled && enumDisabled.indexOf(value) != -1;
          return (
            <MenuItem key={i} value={value} disabled={disabled}>
              {label}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
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
