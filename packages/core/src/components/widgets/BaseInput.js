import React from "react";
import { getInputProps } from "@rjsf/utils";
import PropTypes from "prop-types";

function BaseInput(props) {
  // Note: since React 15.2.0 we can't forward unknown element attributes, so we
  // exclude the "options" and "schema" ones here.
  if (!props.id) {
    console.log("No id for", props);
    throw new Error(`no id for props ${JSON.stringify(props)}`);
  }
  const {
    value,
    readonly,
    disabled,
    autofocus,
    onBlur,
    onFocus,
    options,
    schema,
    uiSchema,
    formContext,
    registry,
    rawErrors,
    type,
    ...rest
  } = props;

  const inputProps = { ...rest, ...getInputProps(schema, type, options) };

  const _onChange = ({ target: { value } }) => {
    return props.onChange(value === "" ? options.emptyValue : value);
  };

  return [
    <input
      key={inputProps.id}
      className="form-control"
      readOnly={readonly}
      disabled={disabled}
      autoFocus={autofocus}
      value={value == null ? "" : value}
      {...inputProps}
      list={schema.examples ? `examples_${inputProps.id}` : null}
      onChange={_onChange}
      onBlur={onBlur && ((event) => onBlur(inputProps.id, event.target.value))}
      onFocus={
        onFocus && ((event) => onFocus(inputProps.id, event.target.value))
      }
    />,
    schema.examples ? (
      <datalist
        key={`datalist_${inputProps.id}`}
        id={`examples_${inputProps.id}`}
      >
        {[
          ...new Set(
            schema.examples.concat(schema.default ? [schema.default] : [])
          ),
        ].map((example) => (
          <option key={example} value={example} />
        ))}
      </datalist>
    ) : null,
  ];
}

BaseInput.defaultProps = {
  required: false,
  disabled: false,
  readonly: false,
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  BaseInput.propTypes = {
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
  };
}

export default BaseInput;
