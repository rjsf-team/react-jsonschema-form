/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function TextareaWidget({
  id,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  label,
  name,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  schema,
  formContext,
}) {
  const semanticProps = getSemanticProps({ formContext, options });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange && onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <Form.TextArea
      id={id}
      key={id}
      label={schema.title || label}
      placeholder={placeholder}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || ""}
      rows={options.rows || 5}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

TextareaWidget.defaultProps = {
  options: {
    semantic: {
      inverted: false,
    },
  },
};

TextareaWidget.propTypes = {
  options: PropTypes.object,
};

export default TextareaWidget;
