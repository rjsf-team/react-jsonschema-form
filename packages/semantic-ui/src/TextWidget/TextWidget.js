/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Input } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function TextWidget({
  id,
  required,
  readonly,
  disabled,
  name,
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
    <Input
      key={id}
      id={id}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || ""}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

TextWidget.defaultProps = {
  options: {
    semanticProps: {
      fluid: true,
    },
  },
};

TextWidget.propTypes = {
  options: PropTypes.object,
};

export default TextWidget;
