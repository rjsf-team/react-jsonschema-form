/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function TextWidget({
  id,
  placeholder,
  required,
  readonly,
  disabled,
  name,
  label,
  schema,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  formContext,
}) {
  const semanticProps = getSemanticProps({ formContext, options });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  return (
    <Form.Input
      key={id}
      id={id}
      placeholder={placeholder}
      type={schema.type}
      label={schema.title || label}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || value === 0 ? value : ""}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

TextWidget.defaultProps = {
  options: {
    semantic: {
      fluid: true,
      inverted: false,
    },
  },
};

TextWidget.propTypes = {
  options: PropTypes.object,
};

export default TextWidget;
